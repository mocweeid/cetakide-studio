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
    const details = formatYogaDetails(json.details);
    throw new Error(`${json.message || `YogaDev belum berhasil (HTTP ${res.status})`}${details}`);
  }

  const provider = json.provider || "YogaDev";
  onStatus?.({ provider, message: "YogaDev mengembalikan gambar", jobId });
  flushSync(() => onFrame(json.imageUrl!, true));
  return { provider };
}