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

        const body = (await request.json()) as {
          prompt: string;
          size?: string;
        };
        if (!body?.prompt) return new Response("prompt required", { status: 400 });

        const size = body.size ?? "1024x1024";
        const prompt = body.prompt.slice(0, 3000);

        // Coba pakai user OpenAI key aktif (prioritas terkecil) — non-streaming
        // karena api.openai.com images tidak streaming di semua model. Kalau
        // gagal atau tak ada, fallback ke Lovable Gateway streaming.
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

        // 0) Try user's own OpenAI API key first (highest priority when provided)
        if (userKey?.api_key) {
          try {
            const oaRes = await fetch("https://api.openai.com/v1/images/generations", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${userKey.api_key}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: userKey.model || "gpt-image-1",
                prompt,
                size,
                n: 1,
              }),
            });
            if (oaRes.ok) {
              const j = (await oaRes.json()) as {
                data?: Array<{ b64_json?: string; url?: string }>;
              };
              let b64 = j.data?.[0]?.b64_json;
              const url = j.data?.[0]?.url;
              if (!b64 && url) {
                const imgRes = await fetch(url);
                const buf = new Uint8Array(await imgRes.arrayBuffer());
                let bin = "";
                for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
                b64 = btoa(bin);
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
                const sseBody = `event: image_generation.completed\ndata: ${JSON.stringify({ type: "image_generation.completed", b64_json: b64, created_at: Date.now() })}\n\n`;
                return new Response(sseBody, {
                  headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache, no-transform",
                    "X-Accel-Buffering": "no",
                  },
                });
              }
            } else {
              const errText = await oaRes.text().catch(() => "");
              console.error("[generate-image-stream] OpenAI user key failed", oaRes.status, errText.slice(0, 300));
              // Mark key status but continue to fallback
              const status = oaRes.status;
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
            }
          } catch (e) {
            console.error("[generate-image-stream] OpenAI user key exception", e);
          }
        }

        // Try Cloudflare Workers AI FLUX.1-schnell first (free tier, fast, mirip OpenAI)
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
              const j = (await cfRes.json()) as {
                result?: { image?: string };
                success?: boolean;
              };
              const b64 = j?.result?.image;
              if (b64) {
                // Wrap into single SSE completed event so client parser handles it uniformly
                const sseBody = `event: image_generation.completed\ndata: ${JSON.stringify({ type: "image_generation.completed", b64_json: b64, created_at: Date.now() })}\n\n`;
                return new Response(sseBody, {
                  headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache, no-transform",
                    "X-Accel-Buffering": "no",
                  },
                });
              }
            }
            // fall through to Lovable Gateway on any failure
          } catch {
            /* fall through */
          }
        }

        // Fallback / default: Lovable Gateway streaming
        const gatewayKey = process.env.LOVABLE_API_KEY;
        if (!gatewayKey && !userKey) {
          return new Response("No AI credentials configured", { status: 500 });
        }

        // Prefer streaming via Lovable Gateway (openai/gpt-image-2)
        const upstream = await fetch(
          "https://ai.gateway.lovable.dev/v1/images/generations",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${gatewayKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/gpt-image-2",
              prompt,
              quality: "low",
              size,
              n: 1,
              stream: true,
              partial_images: 2,
            }),
          },
        );

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => "");
          return new Response(text || "Gateway error", { status: upstream.status });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});