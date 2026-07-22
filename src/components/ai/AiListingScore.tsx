/**
 * AiListingScore — shows AI quality score for a car listing (admin only)
 * Displayed in the listing detail view in AdminInventory.
 */
import { useState } from 'react';
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/db/supabase';
import { cn } from '@/lib/utils';
import type { Car } from '@/types/types';

interface Score {
  score: number;        // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;      // one sentence
  strengths: string[];
  improvements: string[];
}

function ScoreRing({ score }: { score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444';
  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold tabular-nums" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

export default function AiListingScore({ car }: { car: Car }) {
  const [open, setOpen]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [score, setScore]     = useState<Score | null>(null);
  const [error, setError]     = useState('');

  const fetchScore = async () => {
    if (score) { setOpen(o => !o); return; }
    setOpen(true);
    setLoading(true);
    setError('');
    try {
      const prompt = `You are an automotive listing quality expert. Rate this Pakistan car listing on a scale of 0-100 for listing quality (completeness, accuracy, appeal to buyers).

Listing details:
- Title: ${car.title}
- Brand: ${car.brand_name}, Model: ${car.model_name}, Variant: ${car.variant_name || 'none'}
- Year: ${car.year}, Price: PKR ${car.price?.toLocaleString()}
- Mileage: ${car.mileage || 'not provided'} km
- Condition: ${car.condition || 'not provided'}
- Fuel: ${car.fuel_type || 'not provided'}, Trans: ${car.transmission || 'not provided'}
- Body: ${car.body_type || 'not provided'}, Color: ${car.color || 'not provided'}
- Engine: ${car.engine_capacity || 'not provided'}
- Description length: ${car.description?.length || 0} characters
- Images: ${car.images?.length || 0} photos
- City: ${car.city || 'not provided'}

Return ONLY valid JSON:
{
  "score": <0-100>,
  "grade": "A"|"B"|"C"|"D"|"F",
  "summary": "<one sentence summary of listing quality>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}`;

      const { data, error: fnErr } = await supabase.functions.invoke('ai-chatbot', {
        body: { messages: [{ role: 'user', content: prompt }] },
      });
      if (fnErr) throw new Error(await fnErr?.context?.text?.() || fnErr.message);

      // ai-chatbot returns SSE text — extract JSON
      const text = typeof data === 'string' ? data : JSON.stringify(data);
      const match = text.match(/\{[\s\S]*"score"[\s\S]*\}/);
      if (!match) throw new Error('No JSON in response');
      setScore(JSON.parse(match[0]) as Score);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const gradeColor: Record<string, string> = {
    A: 'text-success', B: 'text-[hsl(var(--gold))]',
    C: 'text-orange-500', D: 'text-orange-600', F: 'text-destructive'
  };

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden">
      <button onClick={fetchScore}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/30 transition-colors text-left">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[hsl(var(--gold))]" />
          <span className="text-sm font-medium">AI Listing Quality Score</span>
          {score && (
            <span className={cn('text-xs font-bold ml-1', gradeColor[score.grade])}>
              Grade {score.grade}
            </span>
          )}
        </div>
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          : open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border/40">
          {loading && (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Analysing listing quality…
            </div>
          )}
          {error && <p className="text-xs text-destructive py-3">{error}</p>}
          {score && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <ScoreRing score={score.score} />
                <div>
                  <p className="text-sm font-medium leading-snug">{score.summary}</p>
                  <p className={cn('text-xs font-semibold mt-0.5', gradeColor[score.grade])}>
                    Grade {score.grade} — {score.score}/100
                  </p>
                </div>
              </div>
              {score.strengths.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-success uppercase tracking-widest mb-1">Strengths</p>
                  {score.strengths.map((s, i) => (
                    <p key={i} className="text-xs text-muted-foreground flex gap-1.5 mb-0.5">
                      <span className="text-success shrink-0">✓</span>{s}
                    </p>
                  ))}
                </div>
              )}
              {score.improvements.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-[hsl(var(--gold))] uppercase tracking-widest mb-1">Improvements</p>
                  {score.improvements.map((s, i) => (
                    <p key={i} className="text-xs text-muted-foreground flex gap-1.5 mb-0.5">
                      <span className="text-[hsl(var(--gold))] shrink-0">→</span>{s}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
