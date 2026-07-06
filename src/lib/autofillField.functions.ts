import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type FieldKey =
  | "prompt"
  | "title"
  | "subtitle"
  | "whatsapp"
  | "facebook_url"
  | "instagram_url"
  | "twitter_url"
  | "social_url"
  | "body_content";

const INSTRUCTIONS: Record<FieldKey, string> = {
  prompt:
    "Tulis satu prompt visual iklan singkat (maks 2 kalimat) dalam bahasa Indonesia yang deskriptif dan spesifik warna/mood.",
  title: "Tulis SATU headline iklan singkat maksimal 6 kata, huruf kapital di kata utama, tanpa tanda kutip.",
  subtitle: "Tulis SATU sub-judul pendukung maksimal 10 kata, tanpa tanda kutip.",
  whatsapp: "Buat nomor WhatsApp Indonesia contoh yang valid dengan format 08xx-xxxx-xxxx.",
  facebook_url: "Buat handle/URL Facebook singkat yang cocok untuk brand ini, contoh fb.com/namabrand.",
  instagram_url: "Buat handle Instagram singkat diawali @, satu kata tanpa spasi.",
  twitter_url: "Buat handle Twitter/X singkat diawali @, satu kata tanpa spasi.",
  social_url: "Buat satu URL sosial media pendek yang relevan.",
  body_content:
    "Tulis isi konten iklan 1-2 kalimat pendek, persuasif, dalam bahasa Indonesia, tanpa tanda kutip.",
};

export const autofillFieldServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { field: FieldKey; context: string; currentValue?: string }) => data,
  )
  .handler(async ({ data }) => {
    // Ambil API key Gemini yang dikelola developer dari tabel ai_providers.
    // Fallback ke env GEMINI_API_KEY bila belum ada row aktif.
    let apiKey: string | undefined;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: row } = await supabaseAdmin
        .from("ai_providers")
        .select("api_key")
        .eq("provider", "gemini")
        .eq("is_active", true)
        .order("priority", { ascending: true })
        .order("last_used_at", { ascending: true, nullsFirst: true })
        .limit(1)
        .maybeSingle();
      apiKey = row?.api_key ?? undefined;
    } catch {
      // ignore, fallback ke env
    }
    if (!apiKey) apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "API key Gemini belum diatur. Minta Developer menambahkannya di halaman Admin AI Keys.",
      );
    }

    const instruction = INSTRUCTIONS[data.field];
    const prompt = [
      `Konteks brand/iklan: ${data.context || "(kosong)"}`,
      data.currentValue ? `Nilai saat ini: ${data.currentValue}` : "",
      `Tugas: ${instruction}`,
      "PENTING: Balas HANYA dengan teks jadinya, tanpa penjelasan, tanpa label, tanpa markdown, tanpa tanda kutip.",
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 200 },
        }),
      },
    );
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Gemini error ${res.status}: ${errText.slice(0, 200)}`);
    }
    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    if (!text) throw new Error("Gemini tidak mengembalikan teks.");
    // Strip surrounding quotes if model added them
    const cleaned = text.replace(/^["'“”]+|["'“”]+$/g, "").trim();
    // Update last_used_at best-effort
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("ai_providers")
        .update({ last_used_at: new Date().toISOString(), last_status: "ok" })
        .eq("provider", "gemini")
        .eq("api_key", apiKey);
    } catch {
      /* noop */
    }
    return { value: cleaned };
  });