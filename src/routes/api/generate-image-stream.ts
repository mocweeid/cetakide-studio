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

function proxyGatewayStream(upstream: Response, headers: Headers) {
  const provider = "Lovable Gateway gpt-image-1-mini";
  headers.set("X-Image-Provider", provider);
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = upstream.body!.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = "";
        let lastB64 = "";
        let completed = false;

        const emit = (event: string, payload: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(sseEvent(event, payload)));
        };

        const processPayload = (payload: unknown, eventName = "") => {
          if (!payload || typeof payload !== "object") return;
          const p = payload as { type?: string; error?: { message?: string } };
          if (p.type === "error" || eventName === "error") {
            emit("error", {
              type: "error",
              error: { message: p.error?.message ?? "Gateway belum berhasil generate gambar." },
            });
            completed = true;
            return;
          }
          const b64 = pickB64(payload);
          if (!b64) return;
          lastB64 = b64;
          const incoming = p.type || eventName;
          const isDone = incoming.includes("completed") || incoming.includes("final");
          emit(isDone ? "image_generation.completed" : "image_generation.partial_image", {
            type: isDone ? "image_generation.completed" : "image_generation.partial_image",
            b64_json: b64,
            partial_image_index: 0,
            provider,
            created_at: Date.now(),
          });
          if (isDone) completed = true;
        };

        const processBlock = (block: string) => {
          const trimmed = block.trim();
          if (!trimmed || trimmed === "data: [DONE]" || trimmed === "[DONE]") return;
          if (trimmed.startsWith("{")) {
            try {
              processPayload(JSON.parse(trimmed));
            } catch {
              /* ignore malformed json */
            }
            return;
          }
          const lines = trimmed.split(/\r?\n/);
          const eventName = lines.find((line) => line.startsWith("event:"))?.slice(6).trim() ?? "";
          const data = lines
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trim())
            .join("\n");
          if (!data || data === "[DONE]") return;
          try {
            processPayload(JSON.parse(data), eventName);
          } catch {
            /* ignore malformed event data */
          }
        };

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += value;
            const blocks = buffer.split(/\n\n/);
            buffer = blocks.pop() ?? "";
            for (const block of blocks) processBlock(block);
          }
          if (buffer.trim()) processBlock(buffer);
          if (lastB64 && !completed) {
            emit("image_generation.completed", {
              type: "image_generation.completed",
              b64_json: lastB64,
              provider,
              created_at: Date.now(),
            });
          } else if (!completed) {
            emit("error", {
              type: "error",
              error: { message: "Gateway selesai tanpa gambar final." },
            });
          }
        } catch (e) {
          emit("error", {
            type: "error",
            error: { message: e instanceof Error ? e.message : "Stream gateway terputus." },
          });
        } finally {
          controller.close();
        }
      },
    }),
    { headers },
  );
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

        // 1) User OpenAI key with model fallback (gpt-image-1 → dall-e-3)
        if (userKey?.api_key) {
          const requested = (userKey.model || "gpt-image-1").trim();
          const candidates: Array<{ model: string }> = [{ model: requested }];
          if (!/^dall-e-3$/i.test(requested)) {
            candidates.push({ model: "dall-e-3" });
          }
          for (const c of candidates) {
            try {
              const oaBody: Record<string, unknown> = {
                model: c.model,
                prompt,
                size: "1024x1024",
                n: 1,
              };
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
                  await supabaseClient
                    .from("ai_providers")
                    .update({
                      last_used_at: nowIso,
                      last_status: "ok",
                      failure_count: 0,
                      disabled_until: null,
                    })
                    .eq("id", userKey.id);
                  return sseComplete(b64, `OpenAI ${c.model}`);
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

        // 3) Lovable AI Gateway (streaming)
        const gatewayKey = process.env.LOVABLE_API_KEY;
        if (!gatewayKey) {
          return sseError(
            attempts.length
              ? `Semua provider belum berhasil:\n- ${attempts.join("\n- ")}`
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
            return sseError(`Semua provider belum berhasil:\n- ${attempts.join("\n- ")}`);
          }
          const headers = new Headers(sseHeaders);
          return proxyGatewayStream(upstream, headers);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          attempts.push(`Lovable Gateway exception: ${msg}`);
          return sseError(`Semua provider belum berhasil:\n- ${attempts.join("\n- ")}`);
        }
      },
    },
  },
});