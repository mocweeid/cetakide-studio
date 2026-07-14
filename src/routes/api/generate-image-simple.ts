import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// ------- helpers -------

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function truncate(s: string, n = 1000): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") {
      throw new Error(`YG request timeout setelah ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

type ExtractedImage = { b64_json?: string; url?: string; raw: unknown } | null;

function extractImage(payload: unknown): ExtractedImage {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown> & {
    data?: Array<Record<string, unknown>>;
    output?: Array<Record<string, unknown>>;
    image?: Record<string, unknown> | string;
    images?: Array<string | Record<string, unknown>>;
    result?: Record<string, unknown>;
  };

  const imageObject = typeof p.image === "object" && p.image !== null ? p.image : undefined;
  const firstImage = p.images?.[0];
  const firstImageObject = typeof firstImage === "object" && firstImage !== null ? firstImage : undefined;

  const b64Candidates: unknown[] = [
    p.b64_json,
    typeof p.image === "string" ? p.image : undefined,
    imageObject?.b64_json,
    p.data?.[0]?.b64_json,
    (p.data?.[0]?.image as Record<string, unknown> | undefined)?.b64_json,
    p.output?.[0]?.b64_json,
    (p.output?.[0]?.image as Record<string, unknown> | undefined)?.b64_json,
    typeof firstImage === "string" ? firstImage : undefined,
    firstImageObject?.b64_json,
    p.result?.b64_json,
  ];
  const urlCandidates: unknown[] = [
    p.url,
    (p as Record<string, unknown>).image_url,
    (p as Record<string, unknown>).imageUrl,
    typeof p.image === "string" ? p.image : undefined,
    imageObject?.url,
    imageObject?.image_url,
    p.data?.[0]?.url,
    p.data?.[0]?.image_url,
    p.data?.[0]?.imageUrl,
    p.output?.[0]?.url,
    p.output?.[0]?.image_url,
    typeof firstImage === "string" ? firstImage : undefined,
    firstImageObject?.url,
    firstImageObject?.image_url,
    p.result?.url,
  ];

  const b64 = b64Candidates.find(
    (v) => typeof v === "string" && (v as string).replace(/^data:image\/\w+;base64,/, "").length > 100,
  ) as string | undefined;
  const url = urlCandidates.find(
    (v) => typeof v === "string" && /^https?:\/\//i.test(v as string),
  ) as string | undefined;

  if (!b64 && !url) return null;
  return { b64_json: b64?.replace(/^data:image\/\w+;base64,/, ""), url, raw: payload };
}

async function parseSseImageResponse(response: Response): Promise<ExtractedImage> {
  if (!response.body) throw new Error("YG SSE body kosong");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let lastPayload: unknown = null;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (value) buffer += decoder.decode(value, { stream: true });
      // process complete SSE blocks (separated by blank line)
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) !== -1 || (idx = buffer.indexOf("\r\n\r\n")) !== -1) {
        const sep = buffer.startsWith("\r", idx) ? 4 : 2;
        const block = buffer.slice(0, idx);
        buffer = buffer.slice(idx + sep);
        const dataLines = block
          .split(/\r?\n/)
          .filter((l) => l.startsWith("data:"))
          .map((l) => l.slice(5).trimStart());
        if (!dataLines.length) continue;
        const data = dataLines.join("\n");
        if (!data || data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          lastPayload = parsed;
          const img = extractImage(parsed);
          if (img) {
            reader.cancel().catch(() => {});
            return img;
          }
        } catch {
          /* keep reading */
        }
      }
      if (done) break;
    }
  } finally {
    reader.cancel().catch(() => {});
  }

  const snapshot = lastPayload ? truncate(JSON.stringify(lastPayload)) : truncate(buffer);
  const err = new Error("YG response tidak berisi gambar (SSE)") as Error & {
    lastPayload?: string;
  };
  err.lastPayload = snapshot;
  throw err;
}

async function parseJsonImageResponse(response: Response): Promise<ExtractedImage> {
  const raw = await response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const err = new Error("YG response bukan JSON valid") as Error & { lastPayload?: string };
    err.lastPayload = truncate(raw);
    throw err;
  }
  const img = extractImage(parsed);
  if (!img) {
    const err = new Error("YG response tidak berisi gambar (JSON)") as Error & {
      lastPayload?: string;
    };
    err.lastPayload = truncate(JSON.stringify(parsed));
    throw err;
  }
  return img;
}

async function parseYogaResponse(response: Response): Promise<ExtractedImage> {
  const ct = (response.headers.get("content-type") ?? "").toLowerCase();
  if (ct.includes("text/event-stream")) return parseSseImageResponse(response);
  return parseJsonImageResponse(response);
}

// ------- auth (mirror generate-image-stream) -------

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

async function verifySupabaseAuth(request: Request): Promise<{ userId: string } | Response> {
  const auth = request.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return jsonResponse({ success: false, message: "Unauthorized" }, 401);
  }
  const token = auth.slice(7);
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return jsonResponse({ success: false, message: "Konfigurasi backend belum tersedia" }, 500);
  }
  const supabase = createClient<Database>(url, key, {
    global: { fetch: createSupabaseFetch(key), headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return jsonResponse({ success: false, message: "Unauthorized" }, 401);
  }
  return { userId: data.claims.sub };
}

// ------- route -------

export const Route = createFileRoute("/api/generate-image-simple")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authed = await verifySupabaseAuth(request);
        if (authed instanceof Response) return authed;

        let body: { prompt?: unknown; jobId?: unknown; size?: unknown };
        try {
          body = (await request.json()) as { prompt?: unknown; jobId?: unknown; size?: unknown };
        } catch {
          return jsonResponse({ success: false, message: "Body JSON tidak valid" }, 400);
        }

        const promptRaw = body?.prompt;
        if (typeof promptRaw !== "string") {
          return jsonResponse(
            { success: false, message: "prompt wajib berupa string" },
            400,
          );
        }
        const prompt = promptRaw.trim();
        if (!prompt) {
          return jsonResponse({ success: false, message: "prompt tidak boleh kosong" }, 400);
        }
        if (prompt.length > 3000) {
          return jsonResponse(
            { success: false, message: "prompt melebihi 3000 karakter" },
            400,
          );
        }

        const apiKey = process.env.CUSTOM_AI_API_KEY;
        const baseUrl = process.env.CUSTOM_AI_BASE_URL || "https://ai.yogathedev.com/v1";
        const model = process.env.CUSTOM_AI_MODEL || "cx/gpt-5.5-image";
        const providerLabel = `YogaDev ${model}`;
        const targetUrl = `${baseUrl.replace(/\/$/, "")}/images/generations`;
        // === BYOK: pakai API key OpenAI milik user sendiri ===
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!url || !key) {
          return jsonResponse({ success: false, message: "Konfigurasi backend belum tersedia" }, 500);
        }
        const supabaseUser = createClient<Database>(url, key, {
          global: {
            fetch: createSupabaseFetch(key),
            headers: { Authorization: `Bearer ${request.headers.get("authorization")!.slice(7)}` },
          },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const nowIso = new Date().toISOString();
        const { data: userKeys, error: keysErr } = await supabaseUser
          .from("ai_providers")
          .select("id, api_key, model, label, priority, failure_count")
          .eq("user_id", authed.userId)
          .eq("is_active", true)
          .ilike("provider", "openai")
          .or(`disabled_until.is.null,disabled_until.lt.${nowIso}`)
          .order("priority", { ascending: true })
          .order("created_at", { ascending: true });

        if (keysErr) {
          return jsonResponse(
            { success: false, message: `Gagal membaca API key: ${keysErr.message}` },
            500,
          );
        }
        const userKey = userKeys?.[0];

        if (userKey?.api_key) {
          const modelName = userKey.model || "gpt-image-1";
          try {
            const oaRes = await fetchWithTimeout(
              "https://api.openai.com/v1/images/generations",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${userKey.api_key}`,
                },
                body: JSON.stringify({
                  model: modelName,
                  prompt,
                  n: 1,
                  size: typeof body.size === "string" ? body.size : "1024x1024",
                }),
              },
              180_000,
            );
            const raw = await oaRes.text();
            if (!oaRes.ok) {
              let msg = raw.slice(0, 300);
              try {
                const j = JSON.parse(raw) as { error?: { message?: string } };
                if (j.error?.message) msg = j.error.message;
              } catch { /* ignore */ }
              await supabaseUser
                .from("ai_providers")
                .update({
                  last_status:
                    oaRes.status === 401 ? "invalid" :
                    oaRes.status === 429 ? "rate_limit" :
                    oaRes.status === 402 || oaRes.status === 403 ? "out_of_credit" : "error",
                  failure_count: (userKey.failure_count ?? 0) + 1,
                  is_active: oaRes.status === 401 ? false : true,
                })
                .eq("id", userKey.id);
              return jsonResponse(
                {
                  success: false,
                  message: `OpenAI menolak permintaan (HTTP ${oaRes.status}): ${msg}`,
                  details: { status: oaRes.status },
                },
                oaRes.status,
              );
            }
            const parsed = JSON.parse(raw) as { data?: Array<{ b64_json?: string; url?: string }> };
            const b64 = parsed.data?.[0]?.b64_json;
            const oaUrl = parsed.data?.[0]?.url;
            const imageUrl = b64 ? `data:image/png;base64,${b64}` : oaUrl;
            if (!imageUrl) {
              return jsonResponse(
                { success: false, message: "Respons OpenAI tanpa gambar" },
                502,
              );
            }
            await supabaseUser
              .from("ai_providers")
              .update({
                last_status: "ok",
                failure_count: 0,
                disabled_until: null,
                last_used_at: nowIso,
              })
              .eq("id", userKey.id);
            return jsonResponse({
              success: true,
              imageUrl,
              provider: `OpenAI ${modelName} (${userKey.label ?? "user key"})`,
              jobId: body.jobId,
            });
          } catch (err) {
            return jsonResponse(
              {
                success: false,
                message: `Gagal memanggil OpenAI: ${(err as Error)?.message || "network error"}`,
              },
              502,
            );
          }
        }

        // Tidak ada API key user → minta user pasang key sendiri.
        if (!apiKey) {
          return jsonResponse(
            {
              success: false,
              message:
                "Belum ada API key OpenAI aktif di akun Anda. Buka halaman API Keys dan tambahkan key OpenAI terlebih dulu untuk mulai generate gambar.",
              code: "NO_USER_KEY",
            },
            402,
          );
        }

        let response: Response;
        try {
          response = await fetchWithTimeout(
            targetUrl,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
                Accept: "text/event-stream",
              },
              body: JSON.stringify({
                model,
                prompt,
                n: 1,
                size: "auto",
                quality: "auto",
                background: "auto",
                image_detail: "high",
                output_format: "png",
              }),
            },
            180_000,
          );
        } catch (err) {
          return jsonResponse(
            {
              success: false,
              message: (err as Error)?.message || "Image provider network error",
            },
            502,
          );
        }

        if (!response.ok) {
          const raw = await response.text().catch(() => "");
          return jsonResponse(
            {
              success: false,
              message: `${providerLabel} request failed`,
              details: { status: response.status, body: truncate(raw) },
            },
            response.status >= 400 && response.status < 600 ? response.status : 502,
          );
        }

        try {
          const img = await parseYogaResponse(response);
          if (!img) throw new Error("YG response tidak berisi gambar");
          const imageUrl = img.b64_json
            ? `data:image/png;base64,${img.b64_json}`
            : img.url!;
          return jsonResponse({ success: true, imageUrl, provider: providerLabel, jobId: body.jobId });
        } catch (err) {
          const e = err as Error & { lastPayload?: string };
          return jsonResponse(
            {
              success: false,
              message: e.message || "Gagal memparse response YG",
              details: {
                contentType: response.headers.get("content-type") ?? "",
                lastPayload: e.lastPayload ?? "",
              },
            },
            502,
          );
        }
      },
    },
  },
});
