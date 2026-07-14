import { createFileRoute } from "@tanstack/react-router";

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function truncate(s: string, n = 240): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// In-memory cache (per Worker isolate). Prevents pre-flight from hammering YogaDev.
// TTL configurable via HEALTH_CACHE_TTL_MS (default 3 minutes, min 30s, max 15m).
type HealthPayload = Record<string, unknown>;
type CacheEntry = { at: number; payload: HealthPayload; ok: boolean };
const HEALTH_CACHE = new Map<string, CacheEntry>();
let INFLIGHT: Promise<HealthPayload> | null = null;

function ttlMs(): number {
  const raw = Number(process.env.HEALTH_CACHE_TTL_MS);
  if (!Number.isFinite(raw) || raw <= 0) return 180_000; // 3 min
  return Math.min(15 * 60_000, Math.max(30_000, raw));
}
// Failed probes cache for a shorter window so we recover quickly.
function ttlFailMs(): number {
  const raw = Number(process.env.HEALTH_CACHE_FAIL_TTL_MS);
  if (!Number.isFinite(raw) || raw <= 0) return 30_000;
  return Math.min(5 * 60_000, Math.max(5_000, raw));
}

function cacheKey(baseUrl: string, model: string): string {
  return `${baseUrl}::${model}`;
}

function withCacheMeta(payload: HealthPayload, source: "cache" | "live", cachedAt: number, ttl: number): HealthPayload {
  const ageMs = Date.now() - cachedAt;
  return {
    ...payload,
    cache: {
      source,
      cached_at: new Date(cachedAt).toISOString(),
      age_ms: ageMs,
      ttl_ms: ttl,
      expires_in_ms: Math.max(0, ttl - ageMs),
    },
  };
}

export const Route = createFileRoute("/api/check-yoga")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const apiKey = process.env.CUSTOM_AI_API_KEY;
        const baseUrl = (
          process.env.CUSTOM_AI_BASE_URL || "https://ai.yogathedev.com/v1"
        ).replace(/\/+$/, "");
        const model = process.env.CUSTOM_AI_MODEL || "cx/gpt-5.5-image";

        if (!apiKey) {
          return json(200, {
            ok: false,
            reachable: false,
            error: "CUSTOM_AI_API_KEY belum dikonfigurasi di backend.",
            baseUrl,
            model,
          });
        }

        const url = new URL(request.url);
        const force = url.searchParams.get("force") === "1" || url.searchParams.get("refresh") === "1";
        const key = cacheKey(baseUrl, model);
        const now = Date.now();
        const cached = HEALTH_CACHE.get(key);
        if (!force && cached) {
          const ttl = cached.ok ? ttlMs() : ttlFailMs();
          if (now - cached.at < ttl) {
            return json(200, withCacheMeta(cached.payload, "cache", cached.at, ttl));
          }
        }

        // Coalesce concurrent probes so we only hit YogaDev once at a time.
        if (!force && INFLIGHT) {
          try {
            const payload = await INFLIGHT;
            const entry = HEALTH_CACHE.get(key);
            if (entry) {
              const ttl = entry.ok ? ttlMs() : ttlFailMs();
              return json(200, withCacheMeta(entry.payload, "cache", entry.at, ttl));
            }
            return json(200, payload);
          } catch {
            /* fall through to fresh probe */
          }
        }

        const modelsUrl = `${baseUrl}/models`;
        const started = Date.now();
        const probe = (async (): Promise<HealthPayload> => {
         try {
          const res = await fetchWithTimeout(
            modelsUrl,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: "application/json",
              },
            },
            8000,
          );
          const latency = Date.now() - started;
          const text = await res.text();

          let modelCount = 0;
          let hasTargetModel = false;
          let sampleModels: string[] = [];
          try {
            const j = JSON.parse(text) as {
              data?: Array<{ id?: string }>;
            };
            const list = j.data ?? [];
            modelCount = list.length;
            sampleModels = list
              .map((m) => String(m.id ?? ""))
              .filter(Boolean)
              .slice(0, 6);
            hasTargetModel = list.some(
              (m) => String(m.id ?? "").toLowerCase() === model.toLowerCase(),
            );
          } catch {
            /* body not JSON */
          }

          if (!res.ok) {
            let msg = truncate(text);
            try {
              const j = JSON.parse(text) as { error?: { message?: string } };
              if (j.error?.message) msg = j.error.message;
            } catch {
              /* ignore */
            }
            const payload: HealthPayload = {
              ok: false,
              reachable: true,
              status: res.status,
              latency_ms: latency,
              baseUrl,
              model,
              error: `HTTP ${res.status} — ${msg}`,
            };
            HEALTH_CACHE.set(key, { at: Date.now(), payload, ok: false });
            return payload;
          }

          const payload: HealthPayload = {
            ok: true,
            reachable: true,
            status: res.status,
            latency_ms: latency,
            baseUrl,
            model,
            model_count: modelCount,
            has_target_model: hasTargetModel,
            sample_models: sampleModels,
          };
          HEALTH_CACHE.set(key, { at: Date.now(), payload, ok: true });
          return payload;
         } catch (e) {
          const latency = Date.now() - started;
          const err = e as { name?: string; message?: string };
          const isTimeout = err?.name === "AbortError";
          const payload: HealthPayload = {
            ok: false,
            reachable: false,
            latency_ms: latency,
            baseUrl,
            model,
            error: isTimeout
              ? "Timeout: YogaDev tidak merespons dalam 8 detik."
              : err?.message || String(e),
          };
          HEALTH_CACHE.set(key, { at: Date.now(), payload, ok: false });
          return payload;
         }
        })();
        INFLIGHT = probe;
        try {
          const payload = await probe;
          const ttl = payload.ok ? ttlMs() : ttlFailMs();
          const entry = HEALTH_CACHE.get(key);
          const cachedAt = entry?.at ?? Date.now();
          return json(200, withCacheMeta(payload, "live", cachedAt, ttl));
        } finally {
          if (INFLIGHT === probe) INFLIGHT = null;
        }
      },
    },
  },
});