import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CORS_HEADERS, corsResponse, jsonResponse } from "../_shared/cors.ts";

const GEMINI_URL =
  "https://app-br4xyrp6ul1d-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return corsResponse();

  const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
  if (!apiKey) return jsonResponse({ error: "Server configuration error" }, 500);

  let body: { brand_name?: string; model_name?: string; year?: number; mileage?: string; condition?: string };
  try { body = await req.json(); } catch { return jsonResponse({ error: "Invalid JSON" }, 400); }

  const { brand_name = "", model_name = "", year = "", mileage = "", condition = "used" } = body;

  const prompt = `You are an expert automotive pricing specialist for the Pakistani market. Based on the following vehicle details, provide a realistic price range in Pakistani Rupees (PKR).

Vehicle: ${year} ${brand_name} ${model_name}
Mileage: ${mileage || "unknown"} km
Condition: ${condition}

Respond ONLY with a JSON object in this exact format (no other text):
{
  "min_price": 1500000,
  "max_price": 1800000,
  "suggested_price": 1650000,
  "currency": "PKR",
  "reasoning": "Brief 1-2 sentence explanation"
}`;

  try {
    const upstream = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Gateway-Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    });

    if (!upstream.ok) return jsonResponse({ error: `Upstream ${upstream.status}` }, upstream.status);

    // Collect all SSE chunks into full text
    const reader = upstream.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") break;
        try {
          const parsed = JSON.parse(data);
          fullText += parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        } catch { /* skip */ }
      }
    }

    // Extract JSON from response
    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return jsonResponse({ error: "Could not parse pricing response" }, 422);
    const pricing = JSON.parse(jsonMatch[0]);
    return jsonResponse(pricing);
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
});
