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

// ------- retry config (env-driven, dengan default aman) -------
//
// Semua nilai bisa disetel via .env / dashboard secrets tanpa mengubah kode:
//   RETRY_MAX_ATTEMPTS       (default 3)      total percobaan per attempt shape
//   RETRY_BASE_DELAY_MS      (default 800)    delay awal exponential backoff
//   RETRY_MAX_DELAY_MS       (default 15000)  cap delay per retry
//   RETRY_JITTER_MS          (default 250)    tambahan random 0..N ms
//   RETRY_STATUS_CODES       (default "408,425,429,500,502,503,504")
//                            daftar HTTP status yang boleh di-retry (koma)
//   RETRY_ON_NETWORK_ERROR   (default "true") retry saat network/timeout
//   RETRY_REQUEST_TIMEOUT_MS (default 180000) timeout per fetch YogaDev
function parsePositiveInt(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}
function parseNonNegativeInt(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}
function parseBool(v: string | undefined, fallback: boolean): boolean {
  if (v === undefined) return fallback;
  const s = v.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(s)) return true;
  if (["0", "false", "no", "off"].includes(s)) return false;
  return fallback;
}
function parseStatusCodes(v: string | undefined, fallback: number[]): number[] {
  if (!v) return fallback;
  const parsed = v
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n >= 400 && n < 600);
  return parsed.length ? Array.from(new Set(parsed)) : fallback;
}
function loadRetryConfig() {
  return {
    maxAttempts: parsePositiveInt(process.env.RETRY_MAX_ATTEMPTS, 3),
    baseDelayMs: parseNonNegativeInt(process.env.RETRY_BASE_DELAY_MS, 800),
    maxDelayMs: parsePositiveInt(process.env.RETRY_MAX_DELAY_MS, 15_000),
    jitterMs: parseNonNegativeInt(process.env.RETRY_JITTER_MS, 250),
    statusCodes: parseStatusCodes(
      process.env.RETRY_STATUS_CODES,
      [408, 425, 429, 500, 502, 503, 504],
    ),
    retryOnNetworkError: parseBool(process.env.RETRY_ON_NETWORK_ERROR, true),
    requestTimeoutMs: parsePositiveInt(process.env.RETRY_REQUEST_TIMEOUT_MS, 180_000),
  } as const;
}
function computeBackoff(retry: number, cfg: ReturnType<typeof loadRetryConfig>): number {
  const exp = cfg.baseDelayMs * 2 ** retry;
  const capped = Math.min(exp, cfg.maxDelayMs);
  const jitter = cfg.jitterMs > 0 ? Math.floor(Math.random() * cfg.jitterMs) : 0;
  return capped + jitter;
}

// ------- auto-adjustment untuk error 400/422/429 -------
// Progresif memendekkan prompt dan menyederhanakan payload agar YogaDev
// menerima request pada retry berikutnya (mengurangi variasi/detail).
//   level 0 → prompt asli, semua field opsional
//   level 1 → prompt ≤ 1200 char, drop image_detail & background
//   level 2 → prompt ≤ 600 char, drop output_format & quality
//   level 3+ → prompt ≤ 280 char, hanya {model, prompt, n:1, size:"auto"}
function shortenPromptForRetry(prompt: string, level: number): string {
  if (level <= 0) return prompt;
  const limits = [Infinity, 1200, 600, 280, 160];
  const max = limits[Math.min(level, limits.length - 1)];
  if (prompt.length <= max) return prompt;
  // Ambil kalimat pertama sebisa mungkin, potong di batas kata terdekat.
  const truncated = prompt.slice(0, max);
  const lastStop = Math.max(
    truncated.lastIndexOf(". "),
    truncated.lastIndexOf("! "),
    truncated.lastIndexOf("? "),
    truncated.lastIndexOf(", "),
    truncated.lastIndexOf(" "),
  );
  return (lastStop > max * 0.5 ? truncated.slice(0, lastStop) : truncated).trim();
}

function adjustPayloadForRetry(
  original: Record<string, unknown>,
  prompt: string,
  level: number,
): Record<string, unknown> {
  const p = { ...original, prompt } as Record<string, unknown>;
  if (level >= 1) {
    delete p.image_detail;
    delete p.background;
  }
  if (level >= 2) {
    delete p.output_format;
    delete p.quality;
  }
  if (level >= 3) {
    // sisakan hanya field paling minimal supaya validator YG tidak menolak
    const minimal: Record<string, unknown> = { model: p.model, prompt: p.prompt, n: 1 };
    if (p.size !== undefined) minimal.size = p.size;
    if (p.stream !== undefined) minimal.stream = p.stream;
    return minimal;
  }
  // pastikan n selalu 1 (kurangi variasi)
  if (typeof p.n !== "number" || (p.n as number) > 1) p.n = 1;
  return p;
}

// ------- circuit breaker (in-memory, per Worker instance) -------

type BreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";
const BREAKER = {
  state: "CLOSED" as BreakerState,
  recentFailures: [] as number[], // timestamps (ms) of recent request-level failures
  openedAt: 0,
  cooldownMs: 60_000,
  lastReason: "" as string,
  probeInFlight: false,
};
const BREAKER_WINDOW_MS = 120_000; // 2 minutes
const BREAKER_FAILURE_THRESHOLD = 4; // failed requests (not individual retries)
const BREAKER_COOLDOWN_MS = 60_000; // pause YG for 60s

// Adaptive degradation: kurangi retry & jumlah shape YogaDev seiring naiknya
// kegagalan terkini agar sistem lebih cepat menyerah dan beralih ke fallback.
function computeDegradation(
  cfgMaxAttempts: number,
  totalShapes: number,
  breakerProbe: boolean,
): {
  maxRetries: number;
  maxShapes: number;
  level: "normal" | "degraded" | "critical" | "probe";
  recentFailures: number;
} {
  const now = Date.now();
  BREAKER.recentFailures = BREAKER.recentFailures.filter(
    (t) => now - t <= BREAKER_WINDOW_MS,
  );
  const recent = BREAKER.recentFailures.length;
  if (breakerProbe) {
    // HALF_OPEN probe: 1 shape, 1 retry — cek cepat apakah YG sudah pulih
    return { maxRetries: 1, maxShapes: 1, level: "probe", recentFailures: recent };
  }
  if (recent >= BREAKER_FAILURE_THRESHOLD - 1) {
    // Hampir trip: minimalkan usaha ke YG, biarkan fallback ambil alih
    return { maxRetries: 1, maxShapes: 1, level: "critical", recentFailures: recent };
  }
  if (recent >= 2) {
    return {
      maxRetries: Math.max(1, Math.min(cfgMaxAttempts, 2)),
      maxShapes: Math.max(1, Math.min(totalShapes, 2)),
      level: "degraded",
      recentFailures: recent,
    };
  }
  return {
    maxRetries: cfgMaxAttempts,
    maxShapes: totalShapes,
    level: "normal",
    recentFailures: recent,
  };
}

function breakerRemainingMs(): number {
  if (BREAKER.state !== "OPEN") return 0;
  return Math.max(0, BREAKER.openedAt + BREAKER.cooldownMs - Date.now());
}

function breakerSnapshot() {
  return {
    state: BREAKER.state,
    recentFailures: BREAKER.recentFailures.length,
    threshold: BREAKER_FAILURE_THRESHOLD,
    windowMs: BREAKER_WINDOW_MS,
    cooldownMs: BREAKER.cooldownMs,
    openedAt: BREAKER.openedAt || null,
    remainingMs: breakerRemainingMs(),
    lastReason: BREAKER.lastReason || null,
  };
}

function breakerAllowRequest(requestId: string, jobId?: string): { allowed: boolean; probe: boolean } {
  // Auto-transition OPEN → HALF_OPEN after cooldown
  if (BREAKER.state === "OPEN" && breakerRemainingMs() === 0) {
    BREAKER.state = "HALF_OPEN";
    BREAKER.probeInFlight = false;
    log("info", "breaker_half_open", { requestId, jobId, ...breakerSnapshot() });
  }
  if (BREAKER.state === "OPEN") {
    return { allowed: false, probe: false };
  }
  if (BREAKER.state === "HALF_OPEN") {
    if (BREAKER.probeInFlight) return { allowed: false, probe: false };
    BREAKER.probeInFlight = true;
    return { allowed: true, probe: true };
  }
  return { allowed: true, probe: false };
}

function breakerRecordSuccess(requestId: string, jobId?: string): void {
  BREAKER.recentFailures = [];
  const wasOpen = BREAKER.state !== "CLOSED";
  BREAKER.state = "CLOSED";
  BREAKER.openedAt = 0;
  BREAKER.probeInFlight = false;
  BREAKER.lastReason = "";
  if (wasOpen) log("info", "breaker_closed", { requestId, jobId, ...breakerSnapshot() });
}

function breakerRecordFailure(reason: string, requestId: string, jobId?: string): void {
  const now = Date.now();
  BREAKER.recentFailures = BREAKER.recentFailures.filter((t) => now - t <= BREAKER_WINDOW_MS);
  BREAKER.recentFailures.push(now);
  BREAKER.lastReason = reason;

  if (BREAKER.state === "HALF_OPEN") {
    // probe failed → re-open with longer cooldown (up to 5 min)
    BREAKER.state = "OPEN";
    BREAKER.openedAt = now;
    BREAKER.cooldownMs = Math.min(BREAKER.cooldownMs * 2, 300_000);
    BREAKER.probeInFlight = false;
    log("error", "breaker_reopened", { requestId, jobId, reason, ...breakerSnapshot() });
    return;
  }
  if (BREAKER.recentFailures.length >= BREAKER_FAILURE_THRESHOLD && BREAKER.state === "CLOSED") {
    BREAKER.state = "OPEN";
    BREAKER.openedAt = now;
    BREAKER.cooldownMs = BREAKER_COOLDOWN_MS;
    log("error", "breaker_opened", { requestId, jobId, reason, ...breakerSnapshot() });
  }
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
        const requestId =
          (typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
        const requestStartedAt = Date.now();
        const authed = await verifySupabaseAuth(request);
        if (authed instanceof Response) {
          log("warn", "auth_rejected", { requestId, status: authed.status });
          return authed;
        }
        const userId = authed.userId;

        let body: { prompt?: unknown; jobId?: unknown; size?: unknown };
        try {
          body = (await request.json()) as {
            prompt?: unknown;
            jobId?: unknown;
            size?: unknown;
            forceFallback?: unknown;
            forceFallbackReason?: unknown;
          };
        } catch {
          log("warn", "bad_body", { requestId, userId });
          return jsonResponse({ success: false, message: "Body JSON tidak valid" }, 400);
        }
        const jobId = typeof body.jobId === "string" ? body.jobId : undefined;
        const forceFallback =
          (body as { forceFallback?: unknown }).forceFallback === true;
        const forceFallbackReason =
          typeof (body as { forceFallbackReason?: unknown }).forceFallbackReason === "string"
            ? ((body as { forceFallbackReason?: string }).forceFallbackReason as string)
            : "client requested fallback";

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
          log("error", "missing_api_key", { requestId, userId, jobId });
          return jsonResponse(
            { success: false, message: "CUSTOM_AI_API_KEY belum dikonfigurasi di backend" },
            500,
          );
        }

        log("info", "request_start", {
          requestId,
          userId,
          jobId,
          model,
          targetUrl,
          promptLen: prompt.length,
          sizeParam: typeof body.size === "string" ? body.size : null,
          forceFallback,
        });

        // Auto-fallback: caller (workspace pre-flight) tahu YogaDev tidak punya
        // target model — lompati YogaDev sepenuhnya, langsung ke Lovable Gateway.
        if (forceFallback) {
          log("warn", "force_fallback_requested", {
            requestId,
            jobId,
            userId,
            reason: forceFallbackReason,
          });
          const fallbackStartedAt = Date.now();
          const fallback = await tryLovableGatewayFallback(prompt);
          if (fallback.ok) {
            log("info", "fallback_success", {
              requestId,
              jobId,
              provider: fallback.provider,
              via: "force_fallback",
              durationMs: Date.now() - fallbackStartedAt,
            });
            return jsonResponse({
              success: true,
              imageUrl: fallback.imageUrl,
              provider: fallback.provider,
              jobId,
              requestId,
              fallbackUsed: true,
              primaryProvider: providerLabel,
              notice: `Auto-fallback aktif — ${forceFallbackReason}. Menggunakan ${fallback.provider}.`,
            });
          }
          log("error", "force_fallback_failed", {
            requestId,
            jobId,
            provider: fallback.provider,
            message: fallback.message,
          });
          return jsonResponse(
            {
              success: false,
              message: `Auto-fallback gagal: ${fallback.message}`,
              requestId,
              details: { provider: providerLabel, fallback, reason: forceFallbackReason },
            },
            502,
          );
        }

        const retryCfg = loadRetryConfig();
        log("info", "retry_config", { requestId, jobId, ...retryCfg });

        // Circuit breaker gate: jika YogaDev sedang OPEN, lewati semua attempt YG
        // dan langsung mencoba fallback (atau kembalikan 503 dengan pesan jelas).
        const gate = breakerAllowRequest(requestId, jobId);
        if (!gate.allowed) {
          const remaining = breakerRemainingMs();
          log("warn", "breaker_short_circuit", {
            requestId,
            jobId,
            userId,
            ...breakerSnapshot(),
          });
          const fallbackStartedAt = Date.now();
          const fallback = await tryLovableGatewayFallback(prompt);
          if (fallback.ok) {
            log("info", "fallback_success", {
              requestId,
              jobId,
              provider: fallback.provider,
              via: "breaker_open",
              durationMs: Date.now() - fallbackStartedAt,
            });
            return jsonResponse({
              success: true,
              imageUrl: fallback.imageUrl,
              provider: fallback.provider,
              jobId,
              requestId,
              fallbackUsed: true,
              primaryProvider: providerLabel,
              breaker: breakerSnapshot(),
              notice: `YogaDev sedang gangguan berulang — pakai fallback (${fallback.provider}). Retry YogaDev otomatis dilanjut dalam ${Math.ceil(remaining / 1000)}d.`,
            });
          }
          return jsonResponse(
            {
              success: false,
              message: `YogaDev sedang gangguan berulang. Sistem menjeda retry selama ${Math.ceil(remaining / 1000)} detik agar tidak memperburuk. Coba lagi setelah cooldown atau hubungi admin.`,
              requestId,
              breaker: breakerSnapshot(),
              details: { provider: providerLabel, fallback },
            },
            503,
          );
        }
        const breakerProbe = gate.probe;

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

        const allAttempts: YogaAttempt[] = [
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

        const degradation = computeDegradation(
          retryCfg.maxAttempts,
          allAttempts.length,
          breakerProbe,
        );
        const attempts = allAttempts.slice(0, degradation.maxShapes);
        log("info", "yoga_budget", {
          requestId,
          jobId,
          level: degradation.level,
          recentFailures: degradation.recentFailures,
          effectiveMaxRetries: degradation.maxRetries,
          effectiveMaxShapes: degradation.maxShapes,
          totalShapes: allAttempts.length,
          cfgMaxAttempts: retryCfg.maxAttempts,
        });

        const errors: Array<{
          attempt: string;
          status?: number;
          contentType?: string;
          message: string;
          body?: string;
          requestPayload?: Record<string, unknown>;
        }> = [];

        // Auto-adjustment state: bertambah ketika YG mengembalikan 400/422/429.
        // Dipertahankan lintas attempt agar retry berikutnya makin ringkas.
        let adjustLevel = 0;
        let effectivePrompt = prompt;

        for (const attempt of attempts) {
          const MAX_RETRIES = degradation.maxRetries;
          let credentialFatal = false;
          let attemptSucceeded = false;

          for (let retry = 0; retry < MAX_RETRIES; retry++) {
            const isLastRetry = retry === MAX_RETRIES - 1;
            const retryLabel =
              retry === 0 ? attempt.label : `${attempt.label} (retry ${retry}/${MAX_RETRIES - 1})`;
            const tryStartedAt = Date.now();
            const effectivePayload = adjustPayloadForRetry(
              attempt.payload,
              effectivePrompt,
              adjustLevel,
            );
            log("info", "attempt_start", {
              requestId,
              jobId,
              attempt: attempt.label,
              retry,
              maxRetries: MAX_RETRIES,
              accept: attempt.accept,
              targetUrl,
              adjustLevel,
              promptLen: effectivePrompt.length,
              payloadKeys: Object.keys(effectivePayload),
            });
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
                  body: JSON.stringify(effectivePayload),
                },
                retryCfg.requestTimeoutMs,
              );
            } catch (err) {
              const message = (err as Error)?.message || "Image provider network error";
              const errorType = classifyErrorType({ message });
              const durationMs = Date.now() - tryStartedAt;
              errors.push({ attempt: retryLabel, message, requestPayload: effectivePayload });
              log("warn", "attempt_network_error", {
                requestId,
                jobId,
                attempt: attempt.label,
                retry,
                errorType,
                message,
                durationMs,
              });
              // network / timeout → transient, backoff and retry (opt-in via env)
              if (!isLastRetry && retryCfg.retryOnNetworkError) {
                const delay = computeBackoff(retry, retryCfg);
                log("info", "retry_scheduled", {
                  requestId,
                  jobId,
                  attempt: attempt.label,
                  nextRetry: retry + 1,
                  delayMs: delay,
                  reason: errorType,
                });
                await new Promise((r) => setTimeout(r, delay));
                continue;
              }
              break;
            }

            const contentType = response.headers.get("content-type") ?? "";
            if (!response.ok) {
              const raw = await response.text().catch(() => "");
              const errorType = classifyErrorType({
                status: response.status,
                message: raw,
                body: raw,
              });
              const durationMs = Date.now() - tryStartedAt;
              errors.push({
                attempt: retryLabel,
                status: response.status,
                contentType,
                message: `${providerLabel} request failed`,
                body: truncate(raw),
                requestPayload: effectivePayload,
              });
              log("warn", "attempt_http_error", {
                requestId,
                jobId,
                attempt: attempt.label,
                retry,
                status: response.status,
                contentType,
                errorType,
                durationMs,
                bodyPreview: truncate(raw, 300),
                adjustLevelBefore: adjustLevel,
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
                log("error", "credential_fatal", {
                  requestId,
                  jobId,
                  attempt: attempt.label,
                  status: response.status,
                  errorType,
                });
                break;
              }

              // 400/422/429 → picu auto-adjustment: pendekkan prompt & sederhanakan
              // payload sebelum retry berikutnya. Untuk 400/422 kita paksa retry
              // walau tidak masuk daftar transient default.
              const isAdjustable =
                response.status === 400 ||
                response.status === 422 ||
                response.status === 429;
              if (isAdjustable && !isLastRetry) {
                const prevLevel = adjustLevel;
                adjustLevel = Math.min(adjustLevel + 1, 4);
                effectivePrompt = shortenPromptForRetry(prompt, adjustLevel);
                const retryAfter = Number(response.headers.get("retry-after")) * 1000;
                const delay =
                  Number.isFinite(retryAfter) && retryAfter > 0
                    ? Math.min(retryAfter, retryCfg.maxDelayMs)
                    : computeBackoff(retry, retryCfg);
                log("info", "auto_adjust", {
                  requestId,
                  jobId,
                  attempt: attempt.label,
                  status: response.status,
                  adjustLevelBefore: prevLevel,
                  adjustLevelAfter: adjustLevel,
                  newPromptLen: effectivePrompt.length,
                  delayMs: delay,
                  reason: errorType,
                });
                await new Promise((r) => setTimeout(r, delay));
                continue;
              }

              const isTransient = retryCfg.statusCodes.includes(response.status);
              if (isTransient && !isLastRetry) {
                const retryAfter = Number(response.headers.get("retry-after")) * 1000;
                const delay =
                  Number.isFinite(retryAfter) && retryAfter > 0
                    ? Math.min(retryAfter, retryCfg.maxDelayMs)
                    : computeBackoff(retry, retryCfg);
                log("info", "retry_scheduled", {
                  requestId,
                  jobId,
                  attempt: attempt.label,
                  nextRetry: retry + 1,
                  delayMs: delay,
                  reason: errorType,
                  retryAfterHeader: response.headers.get("retry-after"),
                });
                await new Promise((r) => setTimeout(r, delay));
                continue;
              }
              break;
            }

            try {
              const img = await parseYogaResponse(response);
              if (!img) throw new Error("YG response tidak berisi gambar");
              const imageUrl = img.b64_json ? `data:image/png;base64,${img.b64_json}` : img.url!;
              const durationMs = Date.now() - tryStartedAt;
              const totalMs = Date.now() - requestStartedAt;
              log("info", "attempt_success", {
                requestId,
                jobId,
                attempt: attempt.label,
                retry,
                status: response.status,
                contentType,
                durationMs,
                totalMs,
                imageKind: img.b64_json ? "base64" : "url",
              });
              breakerRecordSuccess(requestId, jobId);
              return jsonResponse({
                success: true,
                imageUrl,
                provider: `${providerLabel} · ${retryLabel}`,
                jobId,
                requestId,
                breaker: breakerSnapshot(),
                probeRecovered: breakerProbe || undefined,
              });
            } catch (err) {
              const e = err as ProviderError;
              const errorType = classifyErrorType({
                status: response.status,
                message: e.message,
                body: e.lastPayload,
              });
              const durationMs = Date.now() - tryStartedAt;
              errors.push({
                attempt: retryLabel,
                status: response.status,
                contentType,
                message: e.message || "Gagal memparse response YG",
                body: e.lastPayload ?? "",
                requestPayload: effectivePayload,
              });
              log("warn", "attempt_parse_error", {
                requestId,
                jobId,
                attempt: attempt.label,
                retry,
                status: response.status,
                contentType,
                errorType,
                durationMs,
                message: e.message,
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
        log("warn", "primary_exhausted", {
          requestId,
          jobId,
          attemptCount: errors.length,
          lastStatus: last?.status,
          lastErrorType: classifyErrorType({
            status: last?.status,
            message: last?.message,
            body: last?.body,
          }),
          totalMs: Date.now() - requestStartedAt,
        });
        breakerRecordFailure(
          `${last?.status ?? "?"} ${last?.message ?? "no image"}`.slice(0, 200),
          requestId,
          jobId,
        );
        const fallbackStartedAt = Date.now();
        const fallback = await tryLovableGatewayFallback(prompt);
        if (fallback.ok) {
          log("info", "fallback_success", {
            requestId,
            jobId,
            provider: fallback.provider,
            durationMs: Date.now() - fallbackStartedAt,
            totalMs: Date.now() - requestStartedAt,
          });
          return jsonResponse({
            success: true,
            imageUrl: fallback.imageUrl,
            provider: fallback.provider,
            jobId,
            requestId,
            fallbackUsed: true,
            primaryProvider: providerLabel,
            primaryErrors: errors,
            breaker: breakerSnapshot(),
          });
        }
        log("error", "request_failed", {
          requestId,
          jobId,
          userId,
          attemptCount: errors.length,
          lastStatus: last?.status,
          lastErrorType: classifyErrorType({
            status: last?.status,
            message: last?.message,
            body: last?.body,
          }),
          fallbackMessage: fallback.ok ? undefined : fallback.message,
          totalMs: Date.now() - requestStartedAt,
        });

        const bs = breakerSnapshot();
        const breakerNote =
          bs.state === "OPEN"
            ? ` Circuit breaker AKTIF: retry YogaDev dijeda ${Math.ceil(bs.remainingMs / 1000)}d.`
            : bs.state === "HALF_OPEN"
              ? " Circuit breaker HALF-OPEN: probe berikutnya menentukan reset."
              : ` (${bs.recentFailures}/${bs.threshold} kegagalan dalam ${Math.round(bs.windowMs / 1000)}d — breaker akan aktif setelah ${bs.threshold} kegagalan.)`;
        return jsonResponse(
          {
            success: false,
            message: credentialError
              ? "YogaDev menolak request: akun/key YogaDev belum punya kredensial provider image upstream. Minta YogaDev mengaktifkan cx/gpt-5.5-image untuk key ini."
              : `${last?.message || `${providerLabel} belum mengembalikan gambar`}.${breakerNote}`,
            requestId,
            breaker: bs,
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
