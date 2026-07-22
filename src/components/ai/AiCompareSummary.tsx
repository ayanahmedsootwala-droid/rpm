import { useState, useRef } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Car } from '@/types/types';

interface Props {
  cars: Car[];
}

export default function AiCompareSummary({ cars }: Props) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const generate = async () => {
    if (loading) return;
    setSummary('');
    setDone(false);
    setLoading(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/ai-compare-cars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseKey}`,
          apikey: supabaseKey,
        },
        body: JSON.stringify({ cars }),
        signal: abortRef.current.signal,
      });

      if (!res.body) throw new Error('No stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const chunk = JSON.parse(data)?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            if (chunk) setSummary(prev => prev + chunk);
          } catch { /* skip */ }
        }
      }
      setDone(true);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setSummary('Unable to generate comparison. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (cars.length < 2) return null;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-secondary/40 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[hsl(var(--gold))]" />
          <span className="text-sm font-medium">AI Comparison Summary</span>
        </div>
        {done && (
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={generate}>
            <RefreshCw className="w-3 h-3" /> Refresh
          </Button>
        )}
      </div>

      <div className="p-4">
        {!summary && !loading && (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground mb-3">
              Get an AI-powered analysis comparing these {cars.length} vehicles
            </p>
            <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={generate}>
              <Sparkles className="w-3.5 h-3.5" />
              Generate AI Analysis
            </Button>
          </div>
        )}

        {(summary || loading) && (
          <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {summary}
            {loading && (
              <span className="inline-flex items-center gap-1 text-muted-foreground ml-1">
                <Loader2 className="w-3 h-3 animate-spin" />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
