import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

async function getUserId(request: Request): Promise<string | null> {
  const auth = request.headers.get("authorization");
  if (!auth) return null;
  const token = auth.replace(/^Bearer\s+/i, "");
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data } = await supabase.auth.getUser(token);
  return data.user?.id ?? null;
}

export const Route = createFileRoute("/api/generate-image-stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const userId = await getUserId(request);
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
        const sseComplete = (b64: string) =>
          new Response(
            `event: image_generation.completed\ndata: ${JSON.stringify({
              type: "image_generation.completed",
              b64_json: b64,
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
        const supabaseAdminClient = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );
        const nowIso = new Date().toISOString();
        const { data: keys } = await supabaseAdminClient
          .from("ai_providers")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .eq("provider", "openai")
          .or(`disabled_until.is.null,disabled_until.lt.${nowIso}`)
          .order("priority", { ascending: true })
          .limit(1);
        const userKey = keys?.[0];

        // 1) User OpenAI key with model fallback (gpt-image-1 → dall-e-3)
        if (userKey?.api_key) {
          const requested = (userKey.model || "gpt-image-1").trim();
          const candidates: Array<{ model: string; withResponseFormat: boolean }> = [
            { model: requested, withResponseFormat: /^dall-e/i.test(requested) },
          ];
          if (!/^dall-e-3$/i.test(requested)) {
            candidates.push({ model: "dall-e-3", withResponseFormat: true });
          }
          for (const c of candidates) {
            try {
              const oaBody: Record<string, unknown> = {
                model: c.model,
                prompt,
                size: "1024x1024",
                n: 1,
              };
              if (c.withResponseFormat) oaBody.response_format = "b64_json";
              const res = await fetch("https://api.openai.com/v1/images/generations", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${userKey.api_key}`,
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
                  await supabaseAdminClient
                    .from("ai_providers")
                    .update({
                      last_used_at: nowIso,
                      last_status: "ok",
                      failure_count: 0,
                      disabled_until: null,
                    })
                    .eq("id", userKey.id);
                  return sseComplete(b64);
                }
                attempts.push(`OpenAI ${c.model}: response tanpa gambar`);
              } else {
                attempts.push(`OpenAI ${c.model} → ${res.status}: ${text.slice(0, 160)}`);
                console.error(
                  "[generate-image-stream] OpenAI failed",
                  c.model,
                  res.status,
                  text.slice(0, 300),
                );
                const status = res.status;
                await supabaseAdminClient
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
                if (status === 401) break;
              }
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              attempts.push(`OpenAI ${c.model} exception: ${msg}`);
              console.error("[generate-image-stream] OpenAI exception", c.model, e);
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
              if (b64) return sseComplete(b64);
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

        // 3) Lovable AI Gateway (streaming)
        const gatewayKey = process.env.LOVABLE_API_KEY;
        if (!gatewayKey) {
          return sseError(
            attempts.length
              ? `Semua provider gagal:\n- ${attempts.join("\n- ")}`
              : "LOVABLE_API_KEY belum tersedia dan tidak ada provider lain.",
          );
        }
        try {
          const upstream = await fetch(
            "https://ai.gateway.lovable.dev/v1/images/generations",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${gatewayKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "openai/gpt-image-1-mini",
                prompt,
                quality: "low",
                size,
                n: 1,
                stream: true,
                partial_images: 1,
              }),
            },
          );
          if (!upstream.ok || !upstream.body) {
            const t = await upstream.text().catch(() => "");
            attempts.push(`Lovable Gateway → ${upstream.status}: ${t.slice(0, 200)}`);
            console.error(
              "[generate-image-stream] Lovable Gateway failed",
              upstream.status,
              t.slice(0, 400),
            );
            return sseError(`Semua provider gagal:\n- ${attempts.join("\n- ")}`);
          }
          return new Response(upstream.body, { headers: sseHeaders });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          attempts.push(`Lovable Gateway exception: ${msg}`);
          return sseError(`Semua provider gagal:\n- ${attempts.join("\n- ")}`);
        }
      },
    },
  },
});