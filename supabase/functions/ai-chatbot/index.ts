import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CORS_HEADERS, corsResponse } from "../_shared/cors.ts";

const GEMINI_URL =
  "https://app-br4xyrp6ul1d-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";

const SYSTEM_PROMPT = `You are an expert automotive advisor for XYZ Automobiles, a premium luxury car marketplace in Pakistan. 
Help users find the perfect vehicle based on their budget, preferences, and needs.
Keep responses concise (2-4 sentences max per reply), friendly, and professional.
Focus on: vehicle recommendations, price ranges in PKR, popular models in Pakistan, buying tips.
If asked about specific cars, mention relevant specs and typical prices in the Pakistani market.
Always suggest visiting XYZ Automobiles inventory for the best deals.`;

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return corsResponse();

  const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
  if (!apiKey) return new Response(JSON.stringify({ error: "Config error" }), { status: 500, headers: CORS_HEADERS });

  let body: { messages: Array<{ role: string; content: string }> };
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: CORS_HEADERS });
  }

  const { messages = [] } = body;
  const contents = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
    { role: "model", parts: [{ text: "Hello! I'm your XYZ Automobiles AI advisor. How can I help you find your perfect car today?" }] },
    ...messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  ];

  try {
    const upstream = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Gateway-Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ contents }),
    });

    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: `Upstream ${upstream.status}` }), {
        status: upstream.status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Stream through as SSE
    return new Response(upstream.body, {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
