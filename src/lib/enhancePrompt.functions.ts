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
  .handler(async ({ data }): Promise<{ enhanced: string }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY tidak tersedia.");
    const system = `You are an art director writing prompts for OpenAI gpt-image-2.
Rewrite the user's idea into 2-3 vivid English sentences that include:
- main subject + visual style (cinematic, editorial, minimalist, hyperreal, etc.)
- lighting & mood
- color palette
- composition & framing suitable for aspect ratio ${data.ratio || "1:1"} on ${data.platform || "social media"}
Return ONLY the final prompt. No quotes, no preface.`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
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
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Enhancer error ${res.status}: ${t.slice(0, 200)}`);
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const enhanced = json.choices?.[0]?.message?.content?.trim() ?? data.prompt;
    return { enhanced };
  });