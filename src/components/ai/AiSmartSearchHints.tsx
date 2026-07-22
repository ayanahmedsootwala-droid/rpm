import { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  query: string;
  onSelect: (suggestion: string) => void;
}

// Static smart hints — these surface contextually based on the typed query
const STATIC_HINTS: Record<string, string[]> = {
  'family':   ['Family SUV under 40 lakhs', 'Family sedan automatic', '7-seater family car'],
  'sport':    ['Sports car Pakistan', 'Sporty sedan fast', 'Performance car low mileage'],
  'suv':      ['SUV automatic Lahore', 'Luxury SUV 2020+', 'Compact SUV petrol'],
  'cheap':    ['Budget car under 15 lakhs', 'Cheap hatchback Karachi', 'Low mileage cheap sedan'],
  'electric': ['Electric car Pakistan', 'Hybrid electric sedan', 'EV SUV'],
  'luxury':   ['Luxury sedan Lahore', 'Premium SUV low mileage', 'BMW Mercedes Pakistan'],
  'toyota':   ['Toyota Corolla 2020', 'Toyota Fortuner 4x4', 'Toyota Hilux pickup'],
  'honda':    ['Honda Civic 2022', 'Honda City automatic', 'Honda BRV 7-seater'],
};

function getHints(q: string): string[] {
  if (!q || q.length < 3) return [];
  const lower = q.toLowerCase();
  for (const [key, hints] of Object.entries(STATIC_HINTS)) {
    if (lower.includes(key)) return hints;
  }
  return [];
}

export default function AiSmartSearchHints({ query, onSelect }: Props) {
  const [hints, setHints] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setHints(getHints(query));
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  if (hints.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-md z-50 overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border/50">
        <Sparkles className="w-3 h-3 text-[hsl(var(--gold))]" />
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">AI Suggestions</span>
      </div>
      {hints.map(h => (
        <button key={h} onClick={() => onSelect(h)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors text-left">
          <span>{h}</span>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </button>
      ))}
    </div>
  );
}
