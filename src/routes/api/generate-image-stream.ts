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
    url?: unknown;
    data?: Array<{ b64_json?: unknown; url?: unknown }>;
    images?: Array<string | { b64_json?: unknown; url?: unknown }>;
  };
  const normalize = (value: unknown) => {
    if (typeof value !== "string" || !value.trim()) return undefined;
    const trimmed = value.trim();
    if (trimmed.startsWith("data:image/")) return trimmed.split(",")[1] || undefined;
    if (/^https?:\/\//i.test(trimmed)) return undefined;
    return trimmed;
  };
  return (
    normalize(p.b64_json) ??
    normalize(p.partial_image_b64) ??
    normalize(p.image) ??
    normalize(p.data?.[0]?.b64_json) ??
    normalize(typeof p.images?.[0] === "string" ? p.images[0] : p.images?.[0]?.b64_json)
  );
}

async function urlToB64(url: string): Promise<string | undefined> {
  const imgRes = await fetch(url);
  if (!imgRes.ok) return undefined;
  const buf = new Uint8Array(await imgRes.arrayBuffer());
  let bin = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < buf.length; i += chunkSize) {
    bin += String.fromCharCode(...buf.subarray(i, i + chunkSize));
  }
  return btoa(bin);
}

async function imageResponseToB64(text: string): Promise<string | undefined> {
  const json = JSON.parse(text) as {
    data?: Array<{ b64_json?: string; url?: string }>;
    url?: string;
    images?: Array<string | { b64_json?: string; url?: string }>;
  };
  const direct = pickB64(json);
  if (direct) return direct;
  const firstImage = json.images?.[0];
  const url =
    json.data?.[0]?.url ??
    json.url ??
    (typeof firstImage === "string" && /^https?:\/\//i.test(firstImage) ? firstImage : undefined) ??
    (typeof firstImage === "object" ? firstImage.url : undefined);
  return url ? urlToB64(url) : undefined;
}

function parseProviderError(text: string) {
  try {
    const j = JSON.parse(text) as { error?: { message?: string }; message?: string };
    return (j.error?.message ?? j.message ?? text).slice(0, 300);
  } catch {
    return text.slice(0, 300);
  }
}

function imageRequestBodies(model: string, prompt: string, size: string) {
  const modelSize = model.includes("dall-e") ? "1024x1024" : size;
  const base = { model, prompt, size: modelSize, n: 1 };
  if (model.includes("dall-e")) {
    return [{ ...base, response_format: "b64_json" }];
  }
  return [
    { ...base, quality: "low", response_format: "b64_json" },
    { ...base, quality: "low" },
    base,
  ];
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

        // 0) Managed Lovable AI Gateway — provider paling andal & sudah teruji.
        //    Diletakkan lebih dulu supaya user tidak lama menunggu percobaan
        //    provider lain kalau ini tersedia.
        const gatewayKey = process.env.LOVABLE_API_KEY;
        if (gatewayKey) {
          const gatewayModel = process.env.LOVABLE_IMAGE_MODEL ?? "openai/gpt-image-1-mini";
          for (const requestBody of imageRequestBodies(gatewayModel, prompt, size)) {
            try {
              const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${gatewayKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
              });
              const text = await res.text();
              if (res.ok) {
                const b64 = await imageResponseToB64(text).catch(() => undefined);
                if (b64) return sseComplete(b64, `Gateway ${gatewayModel}`);
                attempts.push(`Gateway ${gatewayModel}: response tanpa gambar`);
              } else {
                const errMsg = parseProviderError(text);
                attempts.push(`Gateway ${gatewayModel} → ${res.status}: ${errMsg}`);
                console.error("[generate-image-stream] Gateway failed", res.status, errMsg);
                if (res.status === 401 || res.status === 403) break;
              }
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              attempts.push(`Gateway ${gatewayModel} exception: ${msg}`);
              console.error("[generate-image-stream] Gateway exception", e);
            }
          }
        }

        // 1) Custom AI provider (ai.yogathedev.com / 9Router-compatible) via CUSTOM_AI_API_KEY env
        //    Hanya dipakai jika Gateway gagal. Fast-fail: satu auth header,
        //    satu payload — provider ini butuh model `openai/dall-e-3` +
        //    kredensial upstream OpenAI di sisi provider (bukan di sini).
        const customKey = process.env.CUSTOM_AI_API_KEY;
        const customBaseUrl = (process.env.CUSTOM_AI_BASE_URL ?? "https://ai.yogathedev.com/v1").replace(/\/$/, "");
        const customModel = process.env.CUSTOM_AI_MODEL ?? "openai/dall-e-3";
        if (customKey) {
          try {
            const requestBody = { model: customModel, prompt, size, n: 1 };
            const res = await fetch(`${customBaseUrl}/images/generations`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${customKey}`,
              },
              body: JSON.stringify(requestBody),
            });
            const text = await res.text();
            if (res.ok) {
              const b64 = await imageResponseToB64(text).catch(() => undefined);
              if (b64) return sseComplete(b64, `Custom ${customModel}`);
              attempts.push(`Custom ${customModel}: response tanpa gambar`);
            } else {
              const errMsg = parseProviderError(text);
              attempts.push(`Custom ${customModel} → ${res.status}: ${errMsg}`);
              console.error("[generate-image-stream] Custom provider failed", res.status, errMsg);
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            attempts.push(`Custom ${customModel} exception: ${msg}`);
            console.error("[generate-image-stream] Custom provider exception", e);
          }
        }

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
              // Build model-specific request body.
              const oaBody = imageRequestBodies(modelName, prompt, size)[0];

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
                const b64 = await imageResponseToB64(text).catch(() => undefined);
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
                const errMsg = parseProviderError(text);
                attempts.push(`OpenAI ${modelName} → ${res.status}: ${errMsg}`);
                console.error(
                  "[generate-image-stream] OpenAI failed",
                  modelName,
                  res.status,
                  errMsg,
                );
                const status = res.status;
                if (userKey) {
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
                }
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