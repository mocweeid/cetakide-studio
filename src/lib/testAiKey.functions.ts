import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const testAiKeyServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { provider: string; model?: string; api_key: string }) => data)
  .handler(async ({ data, context }) => {
    // Only developers can test keys
    const { data: roleRows } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    const isDev = roleRows?.some((r) => String(r.role).toLowerCase() === "developer");
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
      return { ok: true, status: 200, message: "Key Gemini valid" };
    }

    if (provider === "openai") {
      // Menggunakan GET v1/models karena tidak mengonsumsi biaya/token (Zero Cost Check)
      const res = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${data.api_key}`,
        },
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        return { ok: false, status: res.status, message: t.slice(0, 300) };
      }
      return { ok: true, status: 200, message: "Key OpenAI valid" };
    }

    if (provider === "anthropic") {
      const model = data.model?.trim() || "claude-3-5-haiku-20241022";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": data.api_key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 1,
        }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        return { ok: false, status: res.status, message: t.slice(0, 300) };
      }
      return { ok: true, status: 200, message: "Key Anthropic valid" };
    }

    if (provider === "lovable") {
      return { ok: true, status: 200, message: "Key Lovable simulasi valid" };
    }

    return { ok: false, status: 400, message: `Provider ${provider} belum didukung untuk test.` };
  });