import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CORS_HEADERS, corsResponse } from "../_shared/cors.ts";

const GEMINI_URL =
  "https://app-br4xyrp6ul1d-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";

function carSummary(car: Record<string, unknown>): string {
  return `${car.brand_name} ${car.model_name} ${car.variant_name || ""} ${car.year}
  Price: PKR ${Number(car.price || 0).toLocaleString()}
  Mileage: ${car.mileage ? `${Number(car.mileage).toLocaleString()} km` : "N/A"}
  Fuel: ${car.fuel_type || "N/A"} | Trans: ${car.transmission || "N/A"}
  Engine: ${car.engine_capacity || "N/A"} | Condition: ${car.condition || "N/A"}
  Assembly: ${car.assembly || "N/A"} | City: ${car.city || "N/A"}`;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return corsResponse();

  const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
  if (!apiKey)
    return new Response(JSON.stringify({ error: "Config error" }), {
      status: 500,
      headers: CORS_HEADERS,
    });

  let cars: Record<string, unknown>[];
  try {
    const body = await req.json();
    cars = body.cars;
    if (!Array.isArray(cars) || cars.length < 2)
      throw new Error("Need at least 2 cars");
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  const carDescriptions = cars
    .map((c, i) => `Car ${i + 1}:\n${carSummary(c)}`)
    .join("\n\n");

  const prompt = `You are an automotive expert helping a buyer in Pakistan compare these vehicles side-by-side.

${carDescriptions}

Provide a structured comparison covering:
1. **Value for Money** — which offers better bang for buck and why
2. **Reliability & Maintenance** — typical ownership costs, known issues
3. **Best For** — lifestyle/use case each car suits
4. **Verdict** — a clear recommended pick with one-sentence rationale

Keep the total response under 200 words. Be direct and opinionated — buyers want a clear recommendation.`;

  try {
    const upstream = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gateway-Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });

    if (upstream.status === 429 || upstream.status === 402) {
      return new Response(await upstream.text(), {
        status: upstream.status,
        headers: CORS_HEADERS,
      });
    }
    if (!upstream.ok || !upstream.body) {
      return new Response(
        JSON.stringify({ error: `Upstream error: ${upstream.status}` }),
        { status: 502, headers: CORS_HEADERS }
      );
    }

    return new Response(upstream.body, {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
});
