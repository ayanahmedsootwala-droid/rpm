/**
 * AiValueEstimator — shows AI market value verdict on a car listing
 * Respects the ai_specs_assistant_enabled site setting (reuses that toggle).
 */
import { useState } from 'react';
import { Sparkles, TrendingDown, TrendingUp, Minus, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/db/supabase';
import { cn } from '@/lib/utils';
import type { Car } from '@/types/types';

interface Estimate {
  fair_value_min: number;
  fair_value_max: number;
  verdict: 'below_market' | 'fair' | 'above_market';
  verdict_label: string;
  tip: string;
  factors: string[];
}

export default function AiValueEstimator({ car }: { car: Car }) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [error, setError]       = useState('');

  const fetch = async () => {
    if (estimate) { setOpen(o => !o); return; }
    setOpen(true);
    setLoading(true);
    setError('');
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('ai-value-estimate', {
        body: car,
      });
      if (fnErr) {
        const msg = await fnErr?.context?.text?.() || fnErr.message;
        throw new Error(msg);
      }
      setEstimate(data as Estimate);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch estimate');
    } finally {
      setLoading(false);
    }
  };

  const verdictColor = {
    below_market: 'text-success border-success/30 bg-success/8',
    fair:         'text-[hsl(var(--gold))] border-[hsl(var(--gold)/0.3)] bg-[hsl(var(--gold)/0.07)]',
    above_market: 'text-destructive border-destructive/30 bg-destructive/8',
  };
  const VerdictIcon = estimate?.verdict === 'below_market' ? TrendingDown
    : estimate?.verdict === 'above_market' ? TrendingUp : Minus;

  return (
    <div className="mt-4 border border-border/60 rounded-xl overflow-hidden">
      <button
        onClick={fetch}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[hsl(var(--gold))]" />
          <span className="text-sm font-medium">AI Market Value Estimate</span>
          {estimate && (
            <Badge variant="outline"
              className={cn('text-xs ml-1', verdictColor[estimate.verdict])}>
              {estimate.verdict_label}
            </Badge>
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
              <Loader2 className="w-4 h-4 animate-spin" />
              Analysing Pakistan market data…
            </div>
          )}
          {error && (
            <p className="text-xs text-destructive py-3">{error}</p>
          )}
          {estimate && (
            <div className="space-y-3 pt-2">
              {/* Price range */}
              <div className="flex items-center gap-3">
                <div className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold', verdictColor[estimate.verdict])}>
                  <VerdictIcon className="w-3.5 h-3.5" />
                  {estimate.verdict_label}
                </div>
                <div className="text-sm text-muted-foreground">
                  Fair range: <span className="font-medium text-foreground">
                    PKR {estimate.fair_value_min.toLocaleString()} – {estimate.fair_value_max.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Tip */}
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 leading-relaxed">
                💡 {estimate.tip}
              </p>

              {/* Factors */}
              {estimate.factors.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {estimate.factors.map((f, i) => (
                    <span key={i} className="text-[11px] bg-secondary border border-border/50 rounded-full px-2.5 py-0.5 text-muted-foreground">
                      {f}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-muted-foreground/60 pt-1">
                AI estimate based on Pakistan market data. Verify independently before purchase.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
