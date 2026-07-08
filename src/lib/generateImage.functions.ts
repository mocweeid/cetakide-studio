import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type GenInput = { prompt: string; size?: string };

type GenOutput = {
  imageUrl: string; // data URL (data:image/png;base64,...)
  usedKeyLabel: string | null;
  usedProvider: string; // "openai-user" | "lovable-gateway"
  failovers: number;
};

async function callOpenAI(apiKey: string, model: string, prompt: string, size: string) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: model || "gpt-image-1", prompt, size, n: 1 }),
  });
  return res;
}



export const generateImageServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: GenInput) => {
    if (!data?.prompt || typeof data.prompt !== "string") throw new Error("prompt wajib");
    return { prompt: data.prompt.slice(0, 3000), size: data.size ?? "1024x1024" };
  })
  .handler(async ({ data, context }): Promise<GenOutput> => {
    const { supabase, userId } = context;
    const nowIso = new Date().toISOString();

    // Ambil semua key OpenAI aktif milik user, prioritas tertinggi (angka kecil) dulu.
    const { data: keys } = await supabase
      .from("ai_providers")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .eq("provider", "openai")
      .or(`disabled_until.is.null,disabled_until.lt.${nowIso}`)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true });

    let failovers = 0;
    const attempts = keys ?? [];

    for (const key of attempts) {
      try {
        const res = await callOpenAI(key.api_key, key.model, data.prompt, data.size);
        if (res.ok) {
          const json = (await res.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
          const b64 = json.data?.[0]?.b64_json;
          const url = json.data?.[0]?.url;
          const imageUrl = b64 ? `data:image/png;base64,${b64}` : url;
          if (!imageUrl) throw new Error("Respon OpenAI tanpa gambar.");

          await supabase
            .from("ai_providers")
            .update({
              last_used_at: nowIso,
              last_status: "ok",
              failure_count: 0,
              disabled_until: null,
            })
            .eq("id", key.id);
          await supabase.from("ai_key_events").insert({
            user_id: userId,
            provider_id: key.id,
            event: "used",
            status_code: 200,
          });

          return {
            imageUrl,
            usedKeyLabel: key.label ?? "OpenAI",
            usedProvider: "openai-user",
            failovers,
          };
        }

        // Non-OK → tandai & failover
        const status = res.status;
        let disabledUntil: string | null = null;
        let statusLabel = "error";
        if (status === 401) {
          statusLabel = "invalid";
          await supabase
            .from("ai_providers")
            .update({ is_active: false, last_status: statusLabel, failure_count: key.failure_count + 1 })
            .eq("id", key.id);
        } else if (status === 429) {
          statusLabel = "rate_limit";
          disabledUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        } else if (status === 402 || status === 403) {
          statusLabel = "out_of_credit";
          disabledUntil = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
        }
        if (status !== 401) {
          await supabase
            .from("ai_providers")
            .update({
              last_status: statusLabel,
              failure_count: key.failure_count + 1,
              disabled_until: disabledUntil,
            })
            .eq("id", key.id);
        }
        await supabase.from("ai_key_events").insert({
          user_id: userId,
          provider_id: key.id,
          event: "failover",
          status_code: status,
          detail: (await res.text()).slice(0, 300),
        });
        failovers++;
        continue;
      } catch (err) {
        failovers++;
        await supabase.from("ai_key_events").insert({
          user_id: userId,
          provider_id: key.id,
          event: "error",
          detail: err instanceof Error ? err.message.slice(0, 300) : "unknown",
        });
        continue;
      }
    }

    // Semua key gagal – tampilkan error yang informatif
    const hint = attempts.length > 0
      ? `Semua API key OpenAI gagal:\n- ${attempts.map((a) => a.label ?? "OpenAI").join("\n- ")}`
      : "Tidak ada API key OpenAI aktif. Silakan tambahkan key di halaman Admin AI Keys.";
    throw new Error(hint);
  });