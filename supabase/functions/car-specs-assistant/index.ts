import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CORS_HEADERS, corsResponse } from "../_shared/cors.ts";

const GEMINI_URL =
  "https://app-br4xyrp6ul1d-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return corsResponse();

  const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
  if (!apiKey)
    return new Response(JSON.stringify({ error: "Config error" }), {
      status: 500,
      headers: CORS_HEADERS,
    });

  let body: {
    messages: Array<{ role: string; content: string }>;
    car: {
      title?: string;
      brand_name?: string;
      model_name?: string;
      variant_name?: string;
      year?: number;
      registration_year?: number;
      price?: number;
      mileage?: number;
      fuel_type?: string;
      transmission?: string;
      body_type?: string;
      engine_capacity?: string;
      color?: string;
      condition?: string;
      assembly?: string;
      city?: string;
      description?: string;
    };
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  const { messages = [], car = {} } = body;

  const carContext = `
Car Details:
- Vehicle: ${car.brand_name || ""} ${car.model_name || ""} ${car.variant_name || ""}
- Year: ${car.year || "N/A"} (Registered: ${car.registration_year || "N/A"})
- Price: PKR ${car.price ? Number(car.price).toLocaleString() : "N/A"}
- Mileage: ${car.mileage ? `${Number(car.mileage).toLocaleString()} km` : "N/A"}
- Fuel Type: ${car.fuel_type || "N/A"}
- Transmission: ${car.transmission || "N/A"}
- Body Type: ${car.body_type || "N/A"}
- Engine: ${car.engine_capacity || "N/A"}
- Color: ${car.color || "N/A"}
- Condition: ${car.condition || "N/A"}
- Assembly: ${car.assembly || "N/A"}
- City: ${car.city || "N/A"}
- Description: ${car.description || "N/A"}
`;

  const systemPrompt = `You are an expert automotive advisor for XYZ Automobiles, Pakistan's premium car marketplace.
A user is viewing a specific car listing and asking questions about it.

${carContext}

Your role:
- Answer questions specifically about this car listing
- Provide helpful context about this make/model in the Pakistani market
- Give honest assessments about value, reliability, and what to look for
- Keep answers concise (2–4 sentences), informative, and friendly
- Mention typical maintenance costs, common issues, or buying tips when relevant
- Always answer in the context of the Pakistan automotive market (prices in PKR)`;

  const contents = [
    { role: "user", parts: [{ text: systemPrompt }] },
    {
      role: "model",
      parts: [
        {
          text: "I'm ready to answer your questions about this listing. What would you like to know?",
        },
      ],
    },
    ...messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  ];

  try {
    const upstream = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gateway-Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ contents }),
    });

    if (upstream.status === 429 || upstream.status === 402) {
      const errText = await upstream.text();
      return new Response(errText, {
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
