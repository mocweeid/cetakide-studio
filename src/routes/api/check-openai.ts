import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    if (
      (supabaseKey.startsWith("sb_publishable_") || supabaseKey.startsWith("sb_secret_")) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function makeClient(token: string) {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    global: {
      fetch: createSupabaseFetch(key),
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/check-openai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        if (!auth) return json(401, { ok: false, error: "Unauthorized" });
        const token = auth.replace(/^Bearer\s+/i, "");
        const supabase = makeClient(token);
        const { data: userData } = await supabase.auth.getUser(token);
        const userId = userData.user?.id;
        if (!userId) return json(401, { ok: false, error: "Unauthorized" });

        const { data: keys, error } = await supabase
          .from("ai_providers")
          .select("id, provider, model, api_key, is_active, last_status, failure_count")
          .eq("user_id", userId)
          .in("provider", ["openai", "OpenAI", "OPENAI"])
          .order("priority", { ascending: true })
          .limit(1);
        if (error) return json(500, { ok: false, error: error.message });
        const key = keys?.[0];
        if (!key?.api_key) {
          return json(200, {
            ok: false,
            found: false,
            error: "Belum ada API key OpenAI tersimpan di halaman AI Providers.",
          });
        }

        const started = Date.now();
        try {
          const res = await fetch("https://api.openai.com/v1/models", {
            headers: { Authorization: `Bearer ${key.api_key}` },
          });
          const latency = Date.now() - started;
          const text = await res.text();
          if (!res.ok) {
            let msg = text.slice(0, 240);
            try {
              const j = JSON.parse(text) as { error?: { message?: string } };
              if (j.error?.message) msg = j.error.message;
            } catch {
              /* ignore */
            }
            await supabase
              .from("ai_providers")
              .update({
                last_status:
                  res.status === 401
                    ? "invalid"
                    : res.status === 429
                      ? "rate_limit"
                      : res.status === 402 || res.status === 403
                        ? "out_of_credit"
                        : "error",
                is_active: res.status === 401 ? false : key.is_active,
              })
              .eq("id", key.id);
            return json(200, {
              ok: false,
              found: true,
              status: res.status,
              latency_ms: latency,
              model: key.model,
              error: msg,
            });
          }
          let modelCount = 0;
          let hasImageModel = false;
          try {
            const j = JSON.parse(text) as { data?: Array<{ id?: string }> };
            modelCount = j.data?.length ?? 0;
            hasImageModel =
              j.data?.some((m) =>
                /gpt-image|dall-e/i.test(String(m.id ?? "")),
              ) ?? false;
          } catch {
            /* ignore */
          }
          await supabase
            .from("ai_providers")
            .update({ last_status: "ok", failure_count: 0, disabled_until: null })
            .eq("id", key.id);
          return json(200, {
            ok: true,
            found: true,
            status: 200,
            latency_ms: latency,
            model: key.model,
            model_count: modelCount,
            has_image_model: hasImageModel,
          });
        } catch (e) {
          return json(200, {
            ok: false,
            found: true,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      },
    },
  },
});