import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompare } from '@/contexts/CompareContext';
import { formatCurrency } from '@/lib/utils-xyz';

export function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const navigate = useNavigate();
  const [minimized, setMinimized] = useState(false);

  if (compareList.length === 0) return null;

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="sm"
          onClick={() => setMinimized(false)}
          className="shadow-lg flex items-center gap-2 h-10"
        >
          <Scale className="w-4 h-4" />
          Compare ({compareList.length})
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Scale className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium text-foreground hidden sm:block shrink-0">Compare:</span>
            <div className="flex gap-2 overflow-x-auto min-w-0">
              {compareList.map(car => (
                <div key={car.id} className="flex items-center gap-1.5 bg-secondary rounded-md px-2 py-1 shrink-0">
                  <span className="text-xs text-foreground whitespace-nowrap">
                    {car.year} {car.brand_name} {car.model_name}
                  </span>
                  <button
                    onClick={() => removeFromCompare(car.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {compareList.length < 3 && (
                <div className="flex items-center px-2 py-1 shrink-0">
                  <span className="text-xs text-muted-foreground">Add {3 - compareList.length} more</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={clearCompare} className="h-8 text-xs text-muted-foreground">
              Clear
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setMinimized(true)} className="h-8 text-xs text-muted-foreground hidden sm:flex">
              Minimize
            </Button>
            <Button
              size="sm"
              disabled={compareList.length < 2}
              onClick={() => navigate(`/compare?ids=${compareList.map(c => c.id).join(',')}`)}
              className="h-8 text-xs"
            >
              Compare <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
