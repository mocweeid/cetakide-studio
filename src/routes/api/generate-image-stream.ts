import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

async function getUserId(request: Request): Promise<string | null> {
  const auth = request.headers.get("authorization");
  if (!auth) return null;
  const token = auth.replace(/^Bearer\s+/i, "");
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data } = await supabase.auth.getUser(token);
  return data.user?.id ?? null;
}

export const Route = createFileRoute("/api/generate-image-stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const userId = await getUserId(request);
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as {
          prompt: string;
          size?: string;
        };
        if (!body?.prompt) return new Response("prompt required", { status: 400 });

        const size = body.size ?? "1024x1024";
        const prompt = body.prompt.slice(0, 3000);

        // Coba pakai user OpenAI key aktif (prioritas terkecil) — non-streaming
        // karena api.openai.com images tidak streaming di semua model. Kalau
        // gagal atau tak ada, fallback ke Lovable Gateway streaming.
        const supabaseAdminClient = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );

        const nowIso = new Date().toISOString();
        const { data: keys } = await supabaseAdminClient
          .from("ai_providers")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .eq("provider", "openai")
          .or(`disabled_until.is.null,disabled_until.lt.${nowIso}`)
          .order("priority", { ascending: true })
          .limit(1);

        const userKey = keys?.[0];

        // Fallback / default: Lovable Gateway streaming
        const gatewayKey = process.env.LOVABLE_API_KEY;
        if (!gatewayKey && !userKey) {
          return new Response("No AI credentials configured", { status: 500 });
        }

        // Prefer streaming via Lovable Gateway (openai/gpt-image-2)
        const upstream = await fetch(
          "https://ai.gateway.lovable.dev/v1/images/generations",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${gatewayKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/gpt-image-2",
              prompt,
              quality: "low",
              size,
              n: 1,
              stream: true,
              partial_images: 2,
            }),
          },
        );

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => "");
          return new Response(text || "Gateway error", { status: upstream.status });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});