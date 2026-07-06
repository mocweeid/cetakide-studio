import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const testAiKeyServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { provider: string; model?: string; api_key: string }) => data)
  .handler(async ({ data, context }) => {
    // Only developers can test keys
    const { data: isDev } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "developer",
    });
    if (!isDev) throw new Error("Forbidden");

    const provider = data.provider.toLowerCase();
    if (provider === "gemini") {
      const model = data.model?.trim() || "gemini-2.0-flash";
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${data.api_key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "ping" }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        },
      );
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        return { ok: false, status: res.status, message: t.slice(0, 300) };
      }
      return { ok: true, status: 200, message: "Key valid" };
    }
    return { ok: false, status: 400, message: `Provider ${provider} belum didukung untuk test.` };
  });