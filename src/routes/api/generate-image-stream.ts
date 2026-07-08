import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
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

function makeAuthedClient(token: string) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Konfigurasi database belum tersedia.");
  return createClient<Database>(url, key, {
    global: {
      fetch: createSupabaseFetch(key),
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function sseEvent(event: string, payload: Record<string, unknown>) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function pickB64(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const p = payload as {
    b64_json?: unknown;
    partial_image_b64?: unknown;
    image?: unknown;
    data?: Array<{ b64_json?: unknown }>;
  };
  if (typeof p.b64_json === "string") return p.b64_json;
  if (typeof p.partial_image_b64 === "string") return p.partial_image_b64;
  if (typeof p.image === "string") return p.image;
  const nested = p.data?.[0]?.b64_json;
  return typeof nested === "string" ? nested : undefined;
}



async function getUserId(token: string): Promise<string | null> {
  const supabase = makeAuthedClient(token);
  const { data } = await supabase.auth.getUser(token);
  return data.user?.id ?? null;
}

export const Route = createFileRoute("/api/generate-image-stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        if (!auth) return new Response("Unauthorized", { status: 401 });
        const token = auth.replace(/^Bearer\s+/i, "");
        const userId = await getUserId(token);
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as { prompt: string; size?: string };
        if (!body?.prompt) return new Response("prompt required", { status: 400 });

        const size = body.size ?? "1024x1024";
        const prompt = body.prompt.slice(0, 3000);

        const sseHeaders = {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          "X-Accel-Buffering": "no",
        };
        const sseComplete = (b64: string, provider: string) =>
          new Response(
            `event: image_generation.completed\ndata: ${JSON.stringify({
              type: "image_generation.completed",
              b64_json: b64,
              provider,
              created_at: Date.now(),
            })}\n\n`,
            { headers: sseHeaders },
          );
        const sseError = (message: string) =>
          new Response(
            `event: error\ndata: ${JSON.stringify({ type: "error", error: { message } })}\n\n`,
            { headers: sseHeaders },
          );
        const attempts: string[] = [];

        // Load user's OpenAI keys (highest priority)
        const supabaseClient = makeAuthedClient(token);
        const nowIso = new Date().toISOString();
        const { data: keys, error: keyError } = await supabaseClient
          .from("ai_providers")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .in("provider", ["openai", "OpenAI", "OPENAI"])
          .or(`disabled_until.is.null,disabled_until.lt.${nowIso}`)
          .order("priority", { ascending: true })
          .limit(1);
        if (keyError) {
          attempts.push(`Database provider key → ${keyError.message}`);
          console.error("[generate-image-stream] provider key query failed", keyError.message);
        }
        const userKey = keys?.[0];

        // Jika tidak ada key di DB, coba dari env variable sebagai fallback
        const envApiKey = process.env.OPENAI_API_KEY;
        const openaiBaseUrl = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
        const openaiEnvModel = process.env.OPENAI_MODEL ?? "dall-e-3";
        // Apakah provider ini custom (non-OpenAI asli)?
        const isCustomProvider = openaiBaseUrl !== "https://api.openai.com/v1";

        const activeApiKey = userKey?.api_key ?? envApiKey;

        // 1) OpenAI key (dari DB atau env) dengan model fallback
        if (activeApiKey) {
          // Untuk custom provider: coba model dari env terlebih dahulu
          // Untuk OpenAI asli: fallback ke gpt-image-1 → dall-e-3 → dall-e-2
          const requested = userKey
            ? (userKey.model || "gpt-image-1").trim().toLowerCase()
            : openaiEnvModel.trim().toLowerCase();
          // Untuk custom provider: jangan fallback ke dall-e (model berbeda)
          const candidates: string[] = [requested];
          if (!isCustomProvider) {
            if (!candidates.includes("dall-e-3")) candidates.push("dall-e-3");
            if (!candidates.includes("dall-e-2")) candidates.push("dall-e-2");
          }

          for (const modelName of candidates) {
            try {
              // Build model-specific request body
              let oaBody: Record<string, unknown>;
              if (modelName === "dall-e-3") {
                // dall-e-3: only supports 1024x1024, 1792x1024, 1024x1792
                oaBody = {
                  model: "dall-e-3",
                  prompt,
                  size: "1024x1024",
                  quality: "standard",
                  n: 1,
                  response_format: "b64_json",
                };
              } else if (modelName === "dall-e-2") {
                oaBody = {
                  model: "dall-e-2",
                  prompt: prompt.slice(0, 1000),
                  size: "1024x1024",
                  n: 1,
                  response_format: "b64_json",
                };
              } else {
                // gpt-image-1 and other models
                oaBody = {
                  model: modelName,
                  prompt,
                  size: "1024x1024",
                  quality: "low",
                  n: 1,
                  response_format: "b64_json",
                };
              }

              const res = await fetch(`${openaiBaseUrl}/images/generations`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${activeApiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(oaBody),
              });
              const text = await res.text();
              if (res.ok) {
                let b64: string | undefined;
                try {
                  const j = JSON.parse(text) as {
                    data?: Array<{ b64_json?: string; url?: string }>;
                  };
                  b64 = j.data?.[0]?.b64_json;
                  const url = j.data?.[0]?.url;
                  if (!b64 && url) {
                    const imgRes = await fetch(url);
                    const buf = new Uint8Array(await imgRes.arrayBuffer());
                    let bin = "";
                    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
                    b64 = btoa(bin);
                  }
                } catch {
                  /* ignore parse */
                }
                if (b64) {
                  if (userKey) {
                    await supabaseClient
                      .from("ai_providers")
                      .update({
                        last_used_at: nowIso,
                        last_status: "ok",
                        failure_count: 0,
                        disabled_until: null,
                      })
                      .eq("id", userKey.id);
                  }
                  return sseComplete(b64, `${isCustomProvider ? "Custom" : "OpenAI"} ${modelName}`);
                }
                attempts.push(`OpenAI ${modelName}: response tanpa gambar`);
              } else {
                let errMsg = text.slice(0, 300);
                try {
                  const j = JSON.parse(text) as { error?: { message?: string } };
                  if (j.error?.message) errMsg = j.error.message;
                } catch { /* ignore */ }
                attempts.push(`OpenAI ${modelName} → ${res.status}: ${errMsg}`);
                console.error(
                  "[generate-image-stream] OpenAI failed",
                  modelName,
                  res.status,
                  errMsg,
                );
                const status = res.status;
                await supabaseClient
                  .from("ai_providers")
                  .update({
                    failure_count: (userKey.failure_count ?? 0) + 1,
                    last_status:
                      status === 401
                        ? "invalid"
                        : status === 429
                          ? "rate_limit"
                          : status === 402 || status === 403
                            ? "out_of_credit"
                            : "error",
                    is_active: status === 401 ? false : userKey.is_active,
                  })
                  .eq("id", userKey.id);
                // Stop trying if key is invalid/unauthorized
                if (status === 401) break;
                // Stop trying if out of credit (no point trying other models with same key)
                if (status === 402 || status === 403) break;
              }
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              attempts.push(`OpenAI ${modelName} exception: ${msg}`);
              console.error("[generate-image-stream] OpenAI exception", modelName, e);
            }
          }
        }

        // 2) Cloudflare Workers AI (free tier)
        const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        const cfToken = process.env.CLOUDFLARE_API_TOKEN;
        if (cfAccountId && cfToken) {
          try {
            const cfRes = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${cfToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt, steps: 4 }),
              },
            );
            if (cfRes.ok) {
              const j = (await cfRes.json()) as { result?: { image?: string } };
              const b64 = j?.result?.image;
              if (b64) return sseComplete(b64, "Cloudflare flux-1-schnell");
              attempts.push("Cloudflare: response tanpa gambar");
            } else {
              const t = await cfRes.text().catch(() => "");
              attempts.push(`Cloudflare → ${cfRes.status}: ${t.slice(0, 160)}`);
              console.error("[generate-image-stream] Cloudflare failed", cfRes.status, t.slice(0, 300));
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            attempts.push(`Cloudflare exception: ${msg}`);
            console.error("[generate-image-stream] Cloudflare exception", e);
          }
        }

        // Semua provider gagal – tampilkan error informatif
        const hint = !keys?.length
          ? "Belum ada API key OpenAI yang tersimpan. Silakan tambahkan key di halaman Admin AI Keys."
          : "Semua provider gambar gagal. Pastikan API key OpenAI aktif dan memiliki saldo/akses model DALL-E.";
        return sseError(
          attempts.length
            ? `${hint}\n\nDetail:\n- ${attempts.join("\n- ")}`
            : hint,
        );
      },
    },
  },
});