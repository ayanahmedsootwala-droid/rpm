import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CORS_HEADERS, corsResponse } from "../_shared/cors.ts";

const GEMINI_URL =
  "https://app-br4xyrp6ul1d-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return corsResponse();

  const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Config error" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  let body: { imageBase64: string; mimeType?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const { imageBase64, mimeType = "image/jpeg" } = body;
  if (!imageBase64) {
    return new Response(JSON.stringify({ error: "imageBase64 required" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const prompt = `You are a vehicle number plate detector. Analyze this car image and return ONLY a JSON object with the bounding box coordinates of every visible number plate (license plate) in the image.

Return format (normalized 0.0–1.0 relative to image dimensions):
{
  "plates": [
    { "x": 0.25, "y": 0.72, "width": 0.22, "height": 0.06, "confidence": 0.98 }
  ]
}

Rules:
- x, y = top-left corner (normalized 0.0 to 1.0)
- width, height = dimensions (normalized 0.0 to 1.0)
- confidence = how confident you are this is a plate (0.0–1.0)
- Include ALL visible plates (front, rear, partial)
- If no plates found: { "plates": [] }
- Return ONLY valid JSON, no explanation text`;

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: imageBase64 } },
        ],
      },
    ],
  };

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gateway-Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: `Upstream error: ${response.status}`, detail: errText }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Collect SSE stream and parse the final result
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            fullText += text;
          } catch { /* skip malformed */ }
        }
      }
    }

    // Strip markdown code fences if present
    const stripped = fullText.replace(/```json?\s*/gi, '').replace(/```/g, '').trim();
    // Extract JSON object with plates array
    const jsonMatch = stripped.match(/\{[\s\S]*?"plates"\s*:\s*\[[\s\S]*?\]\s*\}/);
    if (!jsonMatch) {
      // Try broader match
      const broad = stripped.match(/\{[\s\S]*\}/);
      if (!broad) {
        return new Response(JSON.stringify({ plates: [] }), {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
      try {
        const parsed = JSON.parse(broad[0]);
        return new Response(JSON.stringify({ plates: parsed.plates || [] }), {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ plates: [] }), {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
    }

    const result = JSON.parse(jsonMatch[0]);
    return new Response(JSON.stringify(result), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
