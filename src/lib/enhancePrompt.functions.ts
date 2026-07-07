import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const enhancePromptServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { prompt: string; platform?: string; ratio?: string }) => {
    if (!data?.prompt) throw new Error("prompt wajib");
    return {
      prompt: data.prompt.slice(0, 2000),
      platform: data.platform ?? "",
      ratio: data.ratio ?? "",
    };
  })
  .handler(async ({ data, context }): Promise<{ enhanced: string }> => {
    const system = `You are an expert art director and prompt engineer.
Your task is to transform the user's Indonesian input into a highly detailed, professional, and visually stunning English image generation prompt (2-3 sentences).
Ensure you describe:
1. The main subject in a clean, relevant, and appealing way (e.g. if laundry, focus on modern aesthetic laundry shop, fresh clean linen, washing machines, pastel colors, cozy organized environment).
2. The visual style (e.g. minimalist modern design, lifestyle photography, warm editorial, clean layout).
3. Color palette (harmonious colors, fresh pastels, bright tones).
4. Composition, aspect ratio (${data.ratio || "1:1"}), and bright positive mood suitable for ${data.platform || "social media"}.
Do not include any preachy words, explanations, or quotes. Output ONLY the final English prompt.`;

    let apiKey: string | undefined;
    let provider: string | undefined;
    let model: string | undefined;
    let keyRow: any = null;

    // 1. Coba dapatkan key aktif menggunakan keyRotation (Groq/Gemini/OpenAI)
    try {
      const { pickNextKey } = await import("@/lib/keyRotation");
      keyRow = await pickNextKey(context.userId, context.supabase);
      if (keyRow) {
        apiKey = keyRow.api_key;
        provider = keyRow.provider;
        model = keyRow.model;
      }
    } catch {
      // ignore
    }

    // 2. Fallback ke env variables jika tidak ada key di database
    if (!apiKey) {
      if (process.env.GEMINI_API_KEY) {
        apiKey = process.env.GEMINI_API_KEY;
        provider = "gemini";
      } else if (process.env.OPENAI_API_KEY) {
        apiKey = process.env.OPENAI_API_KEY;
        provider = "openai";
      } else if (process.env.LOVABLE_API_KEY) {
        apiKey = process.env.LOVABLE_API_KEY;
        provider = "lovable";
      }
    }

    if (!apiKey) {
      throw new Error("Tidak ada API credentials untuk melakukan enhance prompt.");
    }

    let enhanced = data.prompt;

    try {
      if (provider === "groq" || (provider === "openai" && apiKey.startsWith("gsk_"))) {
        // --- Call Groq ---
        const targetModel = model && model !== "default" && model !== "gpt-4o-mini" ? model : "llama-3.3-70b-versatile";
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: targetModel,
            messages: [
              { role: "system", content: system },
              { role: "user", content: data.prompt },
            ],
            temperature: 0.7,
            max_tokens: 400,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          enhanced = json.choices?.[0]?.message?.content?.trim() ?? data.prompt;
        }
      } else if (provider === "gemini") {
        // --- Call Gemini ---
        const targetModel = model && model !== "default" ? model : "gemini-2.0-flash";
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { role: "user", parts: [{ text: `${system}\n\nUser Input: ${data.prompt}` }] }
              ],
              generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
            }),
          },
        );

        if (res.ok) {
          const json = await res.json();
          enhanced = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? data.prompt;
        }
      } else if (provider === "openai") {
        // --- Call OpenAI ---
        const targetModel = model && model !== "default" ? model : "gpt-4o-mini";
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: targetModel,
            messages: [
              { role: "system", content: system },
              { role: "user", content: data.prompt },
            ],
            temperature: 0.7,
            max_tokens: 400,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          enhanced = json.choices?.[0]?.message?.content?.trim() ?? data.prompt;
        }
      } else if (provider === "lovable") {
        // --- Call Lovable Gateway Fallback ---
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: system },
              { role: "user", content: data.prompt },
            ],
            temperature: 0.7,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          enhanced = json.choices?.[0]?.message?.content?.trim() ?? data.prompt;
        }
      }
    } catch {
      // Jika terjadi kegagalan jaringan/API, tetap kembalikan prompt mentah
      enhanced = data.prompt;
    }

    // Bersihkan karakter kutip di awal dan akhir jika ditambahkan oleh LLM
    const cleaned = enhanced.replace(/^["'“”]+|["'“”]+$/g, "").trim();
    return { enhanced: cleaned };
  });