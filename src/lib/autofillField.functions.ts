import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { pickNextKey, markKeyResult, ProviderKey } from "@/lib/keyRotation";

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
  .handler(async ({ data, context }) => {
    // Ambil API key Gemini menggunakan Key Rotation (pickNextKey)
    let keyRow: ProviderKey | null = null;
    let clientToUse: any = context.supabase;

    // 1. Coba baca menggunakan client user (berfungsi jika user saat ini adalah developer)
    try {
      keyRow = await pickNextKey(context.userId, context.supabase);
    } catch {
      // ignore
    }

    // 2. Coba baca menggunakan admin client (service role)
    if (!keyRow) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        keyRow = await pickNextKey(context.userId, supabaseAdmin);
        if (keyRow) {
          clientToUse = supabaseAdmin;
        }
      } catch {
        // ignore
      }
    }

    let apiKey = keyRow?.api_key;
    if (!apiKey) apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "API key Gemini belum diatur atau habis limit. Minta Developer menambahkannya di halaman Admin AI Keys.",
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
      
      // Catat kegagalan key jika menggunakan key dari database
      if (keyRow) {
        if (res.status === 429) {
          await markKeyResult(context.userId, keyRow, { kind: "rate_limit" }, clientToUse);
        } else if (res.status === 401 || res.status === 403) {
          await markKeyResult(context.userId, keyRow, { kind: "invalid" }, clientToUse);
        } else {
          await markKeyResult(
            context.userId,
            keyRow,
            { kind: "error", statusCode: res.status, message: errText.slice(0, 200) },
            clientToUse,
          );
        }
      }

      throw new Error(`Gemini error ${res.status}: ${errText.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    if (!text) {
      if (keyRow) {
        await markKeyResult(
          context.userId,
          keyRow,
          { kind: "error", message: "Gemini tidak mengembalikan teks" },
          clientToUse,
        );
      }
      throw new Error("Gemini tidak mengembalikan teks.");
    }
    
    // Strip surrounding quotes if model added them
    const cleaned = text.replace(/^["'“”]+|["'“”]+$/g, "").trim();
    
    // Catat sukses pemakaian key
    if (keyRow) {
      try {
        await markKeyResult(context.userId, keyRow, { kind: "ok" }, clientToUse);
      } catch {
        /* noop */
      }
    }
    return { value: cleaned };
  });