import { flushSync } from "react-dom";
import { supabase } from "@/integrations/supabase/client";

type ImageEventPayload =
  | {
      type: "image_generation.partial_image";
      b64_json: string;
      partial_image_index: number;
      created_at: number;
      jobId?: string;
    }
  | {
      type: "image_generation.completed";
      b64_json: string;
      provider?: string;
      created_at: number;
      jobId?: string;
    }
  | { type: "error"; jobId?: string; error: { message: string; type?: string; code?: string } }
  | { type: "provider_status"; provider?: string; message?: string; jobId?: string };

export class GenerateImageError extends Error {
  status: number;
  providerMessage: string;
  suggestion: string;
  attempts: Array<{
    attempt: string;
    status?: number;
    contentType?: string;
    message?: string;
    body?: string;
    requestPayload?: Record<string, unknown>;
    retryAfterSeconds?: number;
  }>;
  rawResponse: unknown;
  rawRequest: Record<string, unknown>;
  targetUrl?: string;
  constructor(opts: {
    message: string;
    status: number;
    providerMessage: string;
    suggestion: string;
    attempts: GenerateImageError["attempts"];
    rawResponse: unknown;
    rawRequest: Record<string, unknown>;
    targetUrl?: string;
  }) {
    super(opts.message);
    this.name = "GenerateImageError";
    this.status = opts.status;
    this.providerMessage = opts.providerMessage;
    this.suggestion = opts.suggestion;
    this.attempts = opts.attempts;
    this.rawResponse = opts.rawResponse;
    this.rawRequest = opts.rawRequest;
    this.targetUrl = opts.targetUrl;
  }
}

function suggestionFor(status: number, text: string): string {
  const t = (text || "").toLowerCase();
  if (status === 401 || status === 403 || t.includes("unauthor") || t.includes("invalid api key"))
    return "API key YogaDev invalid/kadaluarsa — minta developer perbarui CUSTOM_AI_API_KEY.";
  if (status === 402 || t.includes("insufficient") || t.includes("quota") || t.includes("saldo"))
    return "Saldo/kredit provider habis — top-up atau tunggu reset kuota.";
  if (status === 429 || t.includes("rate limit")) return "Rate limit — tunggu 30–60 detik lalu Retry.";
  if (status === 408 || status === 504 || t.includes("timeout"))
    return "Provider timeout — coba Retry, kurangi jumlah variasi, atau ganti rasio 1:1.";
  if (status >= 500) return "Server YogaDev bermasalah — Retry beberapa detik lagi.";
  if (status === 400 || t.includes("invalid") || t.includes("bad request"))
    return "Permintaan ditolak — perpendek prompt atau hapus karakter khusus.";
  if (status === 0) return "Tidak bisa menghubungi YogaDev — cek koneksi internet lalu Retry.";
  return "Coba Retry. Jika masih gagal, laporkan ke developer dengan jobId di terminal.";
}

function formatYogaDetails(details: unknown): string {
  if (!details || typeof details !== "object") return "";
  const attempts = (details as { attempts?: unknown }).attempts;
  if (!Array.isArray(attempts)) return ` · ${JSON.stringify(details).slice(0, 300)}`;
  const lines = attempts
    .map((item, index) => {
      const a = item as { attempt?: string; status?: number; message?: string; body?: string };
      const status = a.status ? `HTTP ${a.status}` : "network";
      const body = a.body ? ` — ${a.body}` : "";
      return `${index + 1}) ${a.attempt || "YogaDev"}: ${status} ${a.message || "gagal"}${body}`;
    })
    .join(" | ");
  return ` · ${lines.slice(0, 700)}`;
}

export async function streamImage(
  prompt: string,
  size: string,
  onFrame: (dataUrl: string, isFinal: boolean) => void,
  jobId?: string,
  onStatus?: (status: { provider?: string; message?: string; jobId?: string }) => void,
  options?: { forceFallback?: boolean; forceFallbackReason?: string },
): Promise<{
  provider: string;
  fallbackUsed?: boolean;
  primaryProvider?: string;
  notice?: string;
  breakerState?: string;
  requestId?: string;
}> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Belum sign in.");

  if (options?.forceFallback) {
    onStatus?.({
      provider: "Lovable Gateway",
      message: `Auto-fallback aktif — ${options.forceFallbackReason || "YogaDev dilewati"}`,
      jobId,
    });
  } else {
    onStatus?.({ provider: "YogaDev", message: "Mengirim permintaan ke YogaDev", jobId });
  }

  const res = await fetch("/api/generate-image-simple", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      prompt,
      size,
      jobId,
      ...(options?.forceFallback
        ? {
            forceFallback: true,
            forceFallbackReason: options.forceFallbackReason || "client requested fallback",
          }
        : {}),
    }),
  });

  let json: {
    success?: boolean;
    imageUrl?: string;
    provider?: string;
    message?: string;
    requestId?: string;
    fallbackUsed?: boolean;
    primaryProvider?: string;
    primaryErrors?: Array<{ status?: number; message?: string; body?: string }>;
    notice?: string;
    breaker?: { state?: string; remainingMs?: number; lastReason?: string };
    details?: { targetUrl?: string; attempts?: unknown; provider?: string; fallback?: unknown };
  };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    throw new Error(`Respons YogaDev tidak valid (HTTP ${res.status})`);
  }

  if (!res.ok || !json.success || !json.imageUrl) {
    const rawAttempts = json.details?.attempts;
    const attempts = Array.isArray(rawAttempts)
      ? (rawAttempts as Array<{
          attempt?: string;
          status?: number;
          contentType?: string;
          message?: string;
          body?: unknown;
          requestPayload?: Record<string, unknown>;
          retryAfterSeconds?: number;
        }>).map(
          (a) => ({
            attempt: a.attempt || "YogaDev",
            status: a.status,
            contentType: a.contentType,
            message: a.message,
            body: toDisplayString(a.body),
            requestPayload: a.requestPayload,
            retryAfterSeconds: a.retryAfterSeconds,
          }),
        )
      : [];
    const last = attempts[attempts.length - 1];
    const providerMessage =
      toDisplayString(last?.body).slice(0, 300) ||
      toDisplayString(last?.message) ||
      toDisplayString(json.message) ||
      "Tidak ada detail dari provider.";
    const status = last?.status ?? res.status;
    const suggestion = suggestionFor(status, `${toDisplayString(json.message)} ${providerMessage}`);
    const details = formatYogaDetails(json.details);
    const reqTag = json.requestId ? ` · req=${json.requestId.slice(0, 8)}` : "";
    const baseMessage =
      toDisplayString(json.message) || `YogaDev belum berhasil (HTTP ${status})`;
    throw new GenerateImageError({
      message: `${baseMessage}${reqTag}${details}`,
      status,
      providerMessage,
      suggestion,
      attempts,
      rawResponse: json,
      rawRequest: { prompt, size, jobId },
      targetUrl: json.details?.targetUrl,
    });
  }

  const provider = json.provider || "YogaDev";
  if (json.fallbackUsed) {
    const lastPrimary = json.primaryErrors?.[json.primaryErrors.length - 1];
    const reason =
      json.breaker?.state === "OPEN"
        ? `circuit breaker AKTIF (${json.breaker.lastReason || "gangguan berulang"})`
        : lastPrimary?.status
          ? `${json.primaryProvider || "YogaDev"} HTTP ${lastPrimary.status} — ${(lastPrimary.message || "gagal").slice(0, 80)}`
          : `${json.primaryProvider || "YogaDev"} tidak merespons`;
    onStatus?.({
      provider,
      message: `⚠ Fallback dipakai: ${provider} · alasan: ${reason}${json.requestId ? ` (req=${json.requestId.slice(0, 8)})` : ""}`,
      jobId,
    });
  } else {
    onStatus?.({
      provider,
      message: `${provider} mengembalikan gambar${json.requestId ? ` (req=${json.requestId.slice(0, 8)})` : ""}`,
      jobId,
    });
  }
  flushSync(() => onFrame(json.imageUrl!, true));
  return {
    provider,
    fallbackUsed: json.fallbackUsed,
    primaryProvider: json.primaryProvider,
    notice: json.notice,
    breakerState: json.breaker?.state,
    requestId: json.requestId,
  };
}