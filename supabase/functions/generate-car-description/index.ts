import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: CORS });

  const apiKey = Deno.env.get('INTEGRATIONS_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  let specs: Record<string, unknown>;
  try {
    specs = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const {
    brand_name, model_name, variant_name,
    year, registration_year, price,
    mileage, condition, fuel_type, transmission,
    body_type, color, engine_capacity, assembly,
    city, is_imported, drive_type,
    doors, seating_capacity, cylinders,
    features = [],
  } = specs;

  const featuresStr = Array.isArray(features) && features.length > 0
    ? `\nFeatures: ${(features as string[]).join(', ')}`
    : '';

  const prompt = `You are an expert automotive copywriter for a premium Pakistani car marketplace called XYZ Automobiles.

Write a compelling, accurate, and professional vehicle listing description for the following car. The description should:
- Be 3–4 paragraphs (120–180 words total)
- Start with the vehicle's key strengths and appeal
- Mention condition, mileage, engine, transmission, and notable features naturally
- Include a sentence about ownership history if condition is "used"
- End with a call to action encouraging buyers to inquire
- Use professional but approachable English tone
- Do NOT include price in the description
- Do NOT use bullet points — write in flowing prose only

Car Details:
Make/Model: ${year} ${brand_name} ${model_name}${variant_name ? ' ' + variant_name : ''}
Condition: ${condition || 'Used'}
Mileage: ${mileage ? `${Number(mileage).toLocaleString()} km` : 'Not specified'}
Engine: ${engine_capacity || 'N/A'} ${fuel_type || ''}
Transmission: ${transmission || 'N/A'}
Body Type: ${body_type || 'N/A'}
Color: ${color || 'N/A'}
Assembly: ${assembly || 'Local'}${is_imported ? ' (Imported)' : ''}
Registered: ${registration_year || year}
City: ${city || 'Pakistan'}
Drive Type: ${drive_type || 'FWD'}
Doors: ${doors || 4}
Seats: ${seating_capacity || 5}${cylinders ? `\nCylinders: ${cylinders}` : ''}${featuresStr}

Write the description now:`;

  // Call Gemini SSE and stream back
  const upstreamRes = await fetch(
    'https://app-br4xyrp6ul1d-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gateway-Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
      signal: AbortSignal.timeout(60_000),
    }
  );

  if (!upstreamRes.ok || !upstreamRes.body) {
    return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
      status: 502,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  // Parse SSE stream, collect full text, return as plain JSON
  const reader = upstreamRes.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const frame = JSON.parse(data);
        const text = frame?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) fullText += text;
      } catch { /* skip */ }
    }
  }

  return new Response(JSON.stringify({ description: fullText.trim() }), {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
