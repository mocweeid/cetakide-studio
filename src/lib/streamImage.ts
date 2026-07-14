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
  attempts: Array<{ attempt: string; status?: number; message?: string; body?: string }>;
  constructor(opts: {
    message: string;
    status: number;
    providerMessage: string;
    suggestion: string;
    attempts: Array<{ attempt: string; status?: number; message?: string; body?: string }>;
  }) {
    super(opts.message);
    this.name = "GenerateImageError";
    this.status = opts.status;
    this.providerMessage = opts.providerMessage;
    this.suggestion = opts.suggestion;
    this.attempts = opts.attempts;
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
): Promise<{ provider: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Belum sign in.");

  onStatus?.({ provider: "YogaDev", message: "Mengirim permintaan ke YogaDev", jobId });

  const res = await fetch("/api/generate-image-simple", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ prompt, size, jobId }),
  });

  let json: {
    success?: boolean;
    imageUrl?: string;
    provider?: string;
    message?: string;
    details?: unknown;
  };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    throw new Error(`Respons YogaDev tidak valid (HTTP ${res.status})`);
  }

  if (!res.ok || !json.success || !json.imageUrl) {
    const rawAttempts = (json.details as { attempts?: unknown } | undefined)?.attempts;
    const attempts = Array.isArray(rawAttempts)
      ? (rawAttempts as Array<{ attempt?: string; status?: number; message?: string; body?: string }>).map(
          (a) => ({
            attempt: a.attempt || "YogaDev",
            status: a.status,
            message: a.message,
            body: a.body,
          }),
        )
      : [];
    const last = attempts[attempts.length - 1];
    const providerMessage =
      last?.body?.slice(0, 300) || last?.message || json.message || "Tidak ada detail dari provider.";
    const status = last?.status ?? res.status;
    const suggestion = suggestionFor(status, `${json.message || ""} ${providerMessage}`);
    const details = formatYogaDetails(json.details);
    throw new GenerateImageError({
      message: `${json.message || `YogaDev belum berhasil (HTTP ${status})`}${details}`,
      status,
      providerMessage,
      suggestion,
      attempts,
    });
  }

  const provider = json.provider || "YogaDev";
  onStatus?.({ provider, message: "YogaDev mengembalikan gambar", jobId });
  flushSync(() => onFrame(json.imageUrl!, true));
  return { provider };
}