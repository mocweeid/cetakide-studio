import { createParser } from "eventsource-parser";
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

  const res = await fetch("/api/generate-image-stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ prompt, size, jobId }),
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`Generate belum berhasil (${res.status}): ${text.slice(0, 200)}`);
  }
  const headerProvider = res.headers.get("X-Image-Provider") ?? "";

  let sawCompleted = false;
  let streamError: string | undefined;
  let provider = headerProvider;

  const parser = createParser({
    onEvent(event) {
      let payload: ImageEventPayload | undefined;
      try {
        payload = JSON.parse(event.data) as ImageEventPayload;
      } catch {
        /* ignore */
      }
      if (event.event === "error" || payload?.type === "error") {
        streamError =
          (payload as { error?: { message?: string } })?.error?.message ??
          "Image generation failed";
        return;
      }
      if (payload?.type === "provider_status") {
        const status = payload as { provider?: string; message?: string; jobId?: string };
        if (status.provider) provider = status.provider;
        onStatus?.(status);
        return;
      }
      if (
        event.event !== "image_generation.partial_image" &&
        event.event !== "image_generation.completed"
      )
        return;
      if (!payload) return;
      const isFinal = event.event === "image_generation.completed";
      if (isFinal) {
        const p = (payload as { provider?: string }).provider;
        if (p) provider = p;
      }
      flushSync(() => {
        onFrame(
          `data:image/png;base64,${(payload as { b64_json: string }).b64_json}`,
          isFinal,
        );
      });
      if (isFinal) sawCompleted = true;
    },
  });

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      parser.feed(value);
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  if (streamError) throw new Error(streamError);
  if (!sawCompleted) throw new Error("Stream berakhir tanpa gambar final.");
  return { provider: provider || "unknown" };
}