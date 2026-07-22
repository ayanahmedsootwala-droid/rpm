import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CORS_HEADERS, corsResponse } from "../_shared/cors.ts";

const GEMINI_URL =
  "https://app-br4xyrp6ul1d-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return corsResponse();

  const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
  if (!apiKey) return new Response(JSON.stringify({ error: "Config error" }), { status: 500, headers: CORS_HEADERS });

  let car: Record<string, unknown>;
  try { car = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: CORS_HEADERS });
  }

  const prompt = `You are a Pakistan automotive market expert. Given this car listing, provide a concise market value assessment.

Car details:
- Brand: ${car.brand_name || "Unknown"}
- Model: ${car.model_name || "Unknown"}
- Variant: ${car.variant_name || ""}
- Year: ${car.year}
- Mileage: ${car.mileage || "N/A"} km
- Condition: ${car.condition || "N/A"}
- Fuel Type: ${car.fuel_type || "N/A"}
- Transmission: ${car.transmission || "N/A"}
- Color: ${car.color || "N/A"}
- City: ${car.city || "N/A"}
- Assembly: ${car.assembly || "N/A"}
- Listed Price: PKR ${Number(car.price).toLocaleString()}

Return ONLY valid JSON:
{
  "fair_value_min": <number in PKR>,
  "fair_value_max": <number in PKR>,
  "verdict": "below_market" | "fair" | "above_market",
  "verdict_label": "<2-4 word label e.g. 'Good Deal' or 'Slightly High'>",
  "tip": "<one sentence buyer tip, max 120 chars>",
  "factors": ["<positive or negative factor 1>", "<factor 2>", "<factor 3>"]
}`;

  try {
    const resp = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gateway-Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });

    if (!resp.ok) throw new Error(`Upstream ${resp.status}`);

    const reader = resp.body!.getReader();
    const dec = new TextDecoder();
    let full = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of dec.decode(value, { stream: true }).split("\n")) {
        if (line.startsWith("data: ")) {
          try {
            const d = JSON.parse(line.slice(6));
            full += d?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          } catch { /* skip */ }
        }
      }
    }

    const jsonMatch = full.match(/\{[\s\S]*"fair_value_min"[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    return new Response(jsonMatch[0], {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
