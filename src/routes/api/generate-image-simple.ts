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

// ------- structured logging -------

type LogLevel = "info" | "warn" | "error";
function log(level: LogLevel, event: string, data: Record<string, unknown>): void {
  try {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      scope: "gen-image",
      event,
      ...data,
    });
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  } catch {
    console.log(`[gen-image] ${event}`, data);
  }
}

function classifyErrorType(opts: {
  status?: number;
  message?: string;
  body?: string;
}): string {
  const { status } = opts;
  const text = `${opts.message ?? ""} ${opts.body ?? ""}`.toLowerCase();
  if (text.includes("timeout") || text.includes("aborterror")) return "network_timeout";
  if (status === undefined && (text.includes("fetch") || text.includes("network"))) return "network_error";
  if (status === 401 || status === 403 || text.includes("unauthor") || text.includes("invalid api key"))
    return "auth";
  if (status === 402 || text.includes("insufficient") || text.includes("quota") || text.includes("no credentials"))
    return "credentials_or_quota";
  if (status === 429 || text.includes("rate limit")) return "rate_limit";
  if (status === 408 || status === 504) return "upstream_timeout";
  if (status && status >= 500) return "transient_5xx";
  if (status === 400 || text.includes("bad request") || text.includes("invalid"))
    return "bad_request";
  if (text.includes("tidak berisi gambar") || text.includes("bukan json") || text.includes("parse"))
    return "parse_error";
  if (status && status >= 400) return `client_${status}`;
  return "unknown";
}

function resolveYogaEndpoint(baseUrl: string): string {
  const clean = baseUrl.replace(/\/+$/, "");
  return /\/images\/generations$/i.test(clean) ? clean : `${clean}/images/generations`;
}

type ProviderError = Error & { lastPayload?: string };

function makeProviderError(message: string, lastPayload?: string): ProviderError {
  const err = new Error(message) as ProviderError;
  if (lastPayload) err.lastPayload = truncate(lastPayload);
  return err;
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

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  return btoa(binary);
}

function cleanBase64(value: string): string | null {
  const dataUri = value.match(/data:image\/[a-z0-9.+-]+;base64,([a-z0-9+/=\s]+)/i);
  const raw = (dataUri?.[1] ?? value).replace(/\s/g, "");
  if (!/^[a-z0-9+/]+={0,2}$/i.test(raw) || raw.length < 120) return null;
  return raw;
}

function imageFromString(value: string): ExtractedImage {
  const trimmed = value.trim();
  const b64 = cleanBase64(trimmed);
  if (b64) return { b64_json: b64, raw: value };

  const dataUriMatch = trimmed.match(/data:image\/[a-z0-9.+-]+;base64,([a-z0-9+/=\s]+)/i);
  if (dataUriMatch?.[1]) return { b64_json: dataUriMatch[1].replace(/\s/g, ""), raw: value };

  const urlMatch = trimmed.match(/https?:\/\/[^\s"'<>]+/i);
  if (urlMatch?.[0]) return { url: urlMatch[0], raw: value };

  const b64Match = trimmed.match(/[a-z0-9+/]{240,}={0,2}/i);
  if (b64Match?.[0]) return { b64_json: b64Match[0], raw: value };

  return null;
}

function extractImageDeep(payload: unknown, depth = 0, seen = new WeakSet<object>()): ExtractedImage {
  if (payload == null || depth > 10) return null;
  if (typeof payload === "string") return imageFromString(payload);
  if (typeof payload !== "object") return null;
  if (seen.has(payload)) return null;
  seen.add(payload);

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const found = extractImageDeep(item, depth + 1, seen);
      if (found) return found;
    }
    return null;
  }

  const record = payload as Record<string, unknown>;
  const priorityKeys = [
    "b64_json",
    "image_url",
    "imageUrl",
    "url",
    "image",
    "images",
    "data",
    "output",
    "result",
    "content",
  ];

  for (const key of priorityKeys) {
    if (key in record) {
      const found = extractImageDeep(record[key], depth + 1, seen);
      if (found) return found;
    }
  }

  for (const value of Object.values(record)) {
    const found = extractImageDeep(value, depth + 1, seen);
    if (found) return found;
  }

  return null;
}

function extractImage(payload: unknown): ExtractedImage {
  const deep = extractImageDeep(payload);
  if (deep) return deep;
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

function parseTextForImage(raw: string): ExtractedImage {
  const direct = imageFromString(raw);
  if (direct) return direct;

  try {
    const parsed = JSON.parse(raw);
    const img = extractImage(parsed);
    if (img) return img;
  } catch {
    /* not plain JSON */
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    const data = trimmed.startsWith("data:") ? trimmed.slice(5).trim() : trimmed;
    if (!data || data === "[DONE]") continue;
    const fromString = imageFromString(data);
    if (fromString) return fromString;
    if (data.startsWith("{") || data.startsWith("[")) {
      try {
        const parsed = JSON.parse(data);
        const img = extractImage(parsed);
        if (img) return img;
      } catch {
        /* keep scanning */
      }
    }
  }

  return null;
}

async function parseSseImageResponse(response: Response): Promise<ExtractedImage> {
  if (!response.body) throw new Error("YG SSE body kosong");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let lastPayload: unknown = null;
  let rawSnapshot = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        rawSnapshot = truncate(rawSnapshot + chunk, 4000);
        const chunkImage = parseTextForImage(chunk);
        if (chunkImage) {
          reader.cancel().catch(() => {});
          return chunkImage;
        }
      }
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
          const img = parseTextForImage(data);
          if (img) {
            reader.cancel().catch(() => {});
            return img;
          }
        }
      }
      if (done) break;
    }
  } finally {
    reader.cancel().catch(() => {});
  }

  const fallback = parseTextForImage(buffer || rawSnapshot);
  if (fallback) return fallback;

  const snapshot = lastPayload ? truncate(JSON.stringify(lastPayload)) : truncate(buffer || rawSnapshot);
  throw makeProviderError("YG response tidak berisi gambar (SSE)", snapshot);
}

async function parseJsonImageResponse(response: Response): Promise<ExtractedImage> {
  const raw = await response.text();
  const fromText = parseTextForImage(raw);
  if (fromText) return fromText;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw makeProviderError("YG response bukan JSON valid", raw);
  }
  const img = extractImage(parsed);
  if (!img) {
    throw makeProviderError("YG response tidak berisi gambar (JSON)", JSON.stringify(parsed));
  }
  return img;
}

async function parseYogaResponse(response: Response): Promise<ExtractedImage> {
  const ct = (response.headers.get("content-type") ?? "").toLowerCase();
  if (ct.startsWith("image/")) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    return { b64_json: bytesToBase64(bytes), raw: { contentType: ct } };
  }
  if (ct.includes("text/event-stream")) return parseSseImageResponse(response);
  return parseJsonImageResponse(response);
}

// ------- fallback: Lovable AI Gateway -------

type FallbackResult =
  | { ok: true; imageUrl: string; provider: string }
  | { ok: false; provider: string; message: string; body?: string };

async function tryLovableGatewayFallback(prompt: string): Promise<FallbackResult> {
  const key = process.env.LOVABLE_API_KEY;
  const provider = "Lovable Gateway openai/gpt-image-1-mini";
  if (!key) {
    return { ok: false, provider, message: "LOVABLE_API_KEY tidak tersedia untuk fallback" };
  }
  try {
    const res = await fetchWithTimeout(
      "https://ai.gateway.lovable.dev/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-image-1-mini",
          prompt,
          n: 1,
          size: "auto",
          quality: "low",
        }),
      },
      120_000,
    );
    if (!res.ok) {
      const raw = await res.text().catch(() => "");
      return {
        ok: false,
        provider,
        message: `Lovable Gateway status ${res.status}`,
        body: truncate(raw),
      };
    }
    const img = await parseYogaResponse(res);
    if (!img) return { ok: false, provider, message: "Lovable Gateway tanpa gambar" };
    const imageUrl = img.b64_json ? `data:image/png;base64,${img.b64_json}` : img.url!;
    return { ok: true, imageUrl, provider };
  } catch (err) {
    return { ok: false, provider, message: (err as Error)?.message || "Lovable Gateway error" };
  }
}

type YogaAttempt = {
  label: string;
  accept: string;
  payload: Record<string, unknown>;
};

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
        const targetUrl = resolveYogaEndpoint(baseUrl);
        if (!apiKey) {
          return jsonResponse(
            { success: false, message: "CUSTOM_AI_API_KEY belum dikonfigurasi di backend" },
            500,
          );
        }

        const basePayload = {
          model,
          prompt,
          n: 1,
          size: "auto",
          quality: "auto",
          background: "auto",
          image_detail: "high",
          output_format: "png",
        } satisfies Record<string, unknown>;

        const attempts: YogaAttempt[] = [
          {
            label: "Payload resmi YogaDev (curl)",
            accept: "text/event-stream",
            payload: { model, prompt, n: 1, size: "auto", quality: "auto" },
          },
          {
            label: "SSE resmi YogaDev",
            accept: "text/event-stream",
            payload: { ...basePayload, stream: true },
          },
          {
            label: "JSON YogaDev",
            accept: "application/json",
            payload: { ...basePayload, stream: false },
          },
          {
            label: "Body minimal YogaDev",
            accept: "application/json",
            payload: { model, prompt, size: "auto", quality: "auto" },
          },
        ];

        const errors: Array<{
          attempt: string;
          status?: number;
          contentType?: string;
          message: string;
          body?: string;
          requestPayload?: Record<string, unknown>;
        }> = [];

        for (const attempt of attempts) {
          const MAX_RETRIES = 3;
          const BASE_DELAY_MS = 800;
          let credentialFatal = false;
          let attemptSucceeded = false;

          for (let retry = 0; retry < MAX_RETRIES; retry++) {
            const isLastRetry = retry === MAX_RETRIES - 1;
            const retryLabel =
              retry === 0 ? attempt.label : `${attempt.label} (retry ${retry}/${MAX_RETRIES - 1})`;
            let response: Response;
            try {
              response = await fetchWithTimeout(
                targetUrl,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                    Accept: attempt.accept,
                  },
                  body: JSON.stringify(attempt.payload),
                },
                180_000,
              );
            } catch (err) {
              const message = (err as Error)?.message || "Image provider network error";
              errors.push({ attempt: retryLabel, message, requestPayload: attempt.payload });
              // network / timeout → transient, backoff and retry
              if (!isLastRetry) {
                const delay = BASE_DELAY_MS * 2 ** retry + Math.floor(Math.random() * 250);
                await new Promise((r) => setTimeout(r, delay));
                continue;
              }
              break;
            }

            const contentType = response.headers.get("content-type") ?? "";
            if (!response.ok) {
              const raw = await response.text().catch(() => "");
              errors.push({
                attempt: retryLabel,
                status: response.status,
                contentType,
                message: `${providerLabel} request failed`,
                body: truncate(raw),
                requestPayload: attempt.payload,
              });

              const lowerRaw = raw.toLowerCase();
              const isAuthFatal =
                response.status === 401 ||
                response.status === 403 ||
                lowerRaw.includes("invalid api key") ||
                lowerRaw.includes("unauthorized") ||
                lowerRaw.includes("no credentials for provider");
              if (isAuthFatal) {
                credentialFatal = true;
                break;
              }

              const isTransient =
                response.status === 408 ||
                response.status === 425 ||
                response.status === 429 ||
                response.status >= 500;
              if (isTransient && !isLastRetry) {
                const retryAfter = Number(response.headers.get("retry-after")) * 1000;
                const delay =
                  Number.isFinite(retryAfter) && retryAfter > 0
                    ? retryAfter
                    : BASE_DELAY_MS * 2 ** retry + Math.floor(Math.random() * 250);
                await new Promise((r) => setTimeout(r, delay));
                continue;
              }
              break;
            }

            try {
              const img = await parseYogaResponse(response);
              if (!img) throw new Error("YG response tidak berisi gambar");
              const imageUrl = img.b64_json ? `data:image/png;base64,${img.b64_json}` : img.url!;
              return jsonResponse({
                success: true,
                imageUrl,
                provider: `${providerLabel} · ${retryLabel}`,
                jobId: body.jobId,
              });
            } catch (err) {
              const e = err as ProviderError;
              errors.push({
                attempt: retryLabel,
                status: response.status,
                contentType,
                message: e.message || "Gagal memparse response YG",
                body: e.lastPayload ?? "",
                requestPayload: attempt.payload,
              });
              // parse failure → try next attempt shape, no more retries here
              break;
            }
          }

          if (credentialFatal) break;
          if (attemptSucceeded) break;
        }

        const last = errors.at(-1);
        const credentialError = errors.find((e) =>
          `${e.message} ${e.body ?? ""}`.toLowerCase().includes("no credentials for provider"),
        );

        // Semua attempt YG gagal → coba Lovable Gateway supaya user tidak terkunci
        const fallback = await tryLovableGatewayFallback(prompt);
        if (fallback.ok) {
          return jsonResponse({
            success: true,
            imageUrl: fallback.imageUrl,
            provider: fallback.provider,
            jobId: body.jobId,
            fallbackUsed: true,
            primaryProvider: providerLabel,
            primaryErrors: errors,
          });
        }

        return jsonResponse(
          {
            success: false,
            message: credentialError
              ? "YogaDev menolak request: akun/key YogaDev belum punya kredensial provider image upstream. Minta YogaDev mengaktifkan cx/gpt-5.5-image untuk key ini."
              : last?.message || `${providerLabel} belum mengembalikan gambar`,
            details: {
              provider: providerLabel,
              targetUrl,
              attempts: errors,
              fallback,
            },
          },
          502,
        );
      },
    },
  },
});
