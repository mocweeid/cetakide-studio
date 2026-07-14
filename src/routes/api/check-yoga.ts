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

export const Route = createFileRoute("/api/check-yoga")({
  server: {
    handlers: {
      GET: async () => {
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

        const modelsUrl = `${baseUrl}/models`;
        const started = Date.now();
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
            return json(200, {
              ok: false,
              reachable: true,
              status: res.status,
              latency_ms: latency,
              baseUrl,
              model,
              error: `HTTP ${res.status} — ${msg}`,
            });
          }

          return json(200, {
            ok: true,
            reachable: true,
            status: res.status,
            latency_ms: latency,
            baseUrl,
            model,
            model_count: modelCount,
            has_target_model: hasTargetModel,
            sample_models: sampleModels,
          });
        } catch (e) {
          const latency = Date.now() - started;
          const err = e as { name?: string; message?: string };
          const isTimeout = err?.name === "AbortError";
          return json(200, {
            ok: false,
            reachable: false,
            latency_ms: latency,
            baseUrl,
            model,
            error: isTimeout
              ? "Timeout: YogaDev tidak merespons dalam 8 detik."
              : err?.message || String(e),
          });
        }
      },
    },
  },
});