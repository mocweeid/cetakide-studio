import { supabase } from "@/integrations/supabase/client";

export type SimpleGenerateResult = {
  success: boolean;
  imageUrl?: string;
  provider?: string;
  message?: string;
  details?: unknown;
};

export async function generateImageSimple(prompt: string): Promise<SimpleGenerateResult> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { success: false, message: "Belum sign in." };

    const res = await fetch("/api/generate-image-simple", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt }),
    });

    let json: SimpleGenerateResult;
    try {
      json = (await res.json()) as SimpleGenerateResult;
    } catch {
      return { success: false, message: `Respons tidak valid (HTTP ${res.status})` };
    }
    return json;
  } catch (err) {
    return { success: false, message: (err as Error)?.message || "Network error" };
  }
}
