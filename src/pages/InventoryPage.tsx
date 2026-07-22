import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SlidersHorizontal, X, Grid, List, Search, BookmarkPlus, BookmarkCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { CarCard } from '@/components/cars/CarCard';
import { useCars } from '@/hooks/useCars';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useCarDatabase } from '@/hooks/useCarDatabase';
import AiSmartSearchHints from '@/components/ai/AiSmartSearchHints';
import CarBrandModelSelect from '@/components/cars/CarBrandModelSelect';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import type { CarFilters, CarBrand } from '@/types/types';
import { BODY_TYPES, FUEL_TYPES, TRANSMISSION_TYPES, CONDITIONS, PAKISTANI_CITIES, YEARS } from '@/lib/utils-xyz';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;

function CarSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-9 w-full mt-2" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function FilterPanel({ filters, setFilters, onClose, auctionsOn }: {
  filters: CarFilters; setFilters: (f: CarFilters) => void;
  onClose?: () => void; auctionsOn?: boolean;
}) {
  const { t } = useLanguage();
  const { brands } = useCarDatabase();
  const set = (k: keyof CarFilters, v: unknown) => setFilters({ ...filters, [k]: v || undefined });
  const clear = () => { setFilters({ status: 'active' }); onClose?.(); };

  const resolvedBrandId = filters.brand_id || (filters.make ? brands.find(b => b.name.toLowerCase() === filters.make?.toLowerCase())?.id : undefined);

  return (
    <div className="flex flex-col gap-5 p-4 md:p-0">
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Brand / Model / Variant</Label>
        <CarBrandModelSelect
          brandId={resolvedBrandId || ''}
          modelId={filters.model_id || ''}
          variantId={filters.variant_id || ''}
          onBrandChange={v => setFilters({ ...filters, brand_id: v || undefined, make: undefined, model_id: undefined, variant_id: undefined })}
          onModelChange={v => setFilters({ ...filters, model_id: v || undefined, variant_id: undefined })}
          onVariantChange={v => setFilters({ ...filters, variant_id: v || undefined })}
          className="grid-cols-1 gap-2"
          labelClass="text-xs text-muted-foreground"
        />
      </div>
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Body Type</Label>
        <Select value={filters.body_type || 'all'} onValueChange={v => set('body_type', v === 'all' ? '' : v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {BODY_TYPES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">City</Label>
        <Select value={filters.city || 'all'} onValueChange={v => set('city', v === 'all' ? '' : v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={t('allCities')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {PAKISTANI_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Year</Label>
        <div className="flex items-center gap-2">
          <Select value={String(filters.year_min || 'all')} onValueChange={v => set('year_min', v === 'all' ? '' : Number(v))}>
            <SelectTrigger className="h-9 text-sm flex-1"><SelectValue placeholder="From" /></SelectTrigger>
            <SelectContent>{[{ label: 'From', value: 'all' }, ...YEARS.map(y => ({ label: String(y), value: String(y) }))].map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
          <span className="text-muted-foreground text-sm">—</span>
          <Select value={String(filters.year_max || 'all')} onValueChange={v => set('year_max', v === 'all' ? '' : Number(v))}>
            <SelectTrigger className="h-9 text-sm flex-1"><SelectValue placeholder="To" /></SelectTrigger>
            <SelectContent>{[{ label: 'To', value: 'all' }, ...YEARS.map(y => ({ label: String(y), value: String(y) }))].map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
          Price Range: PKR {(filters.price_min || 0).toLocaleString()} – {(filters.price_max || 20000000).toLocaleString()}
        </Label>
        <Slider
          value={[filters.price_min || 0, filters.price_max || 20000000]}
          min={0} max={20000000} step={100000}
          onValueChange={([min, max]) => setFilters({ ...filters, price_min: min, price_max: max })}
          className="mt-2"
        />
      </div>
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Fuel Type</Label>
        <Select value={filters.fuel_type || 'all'} onValueChange={v => set('fuel_type', v === 'all' ? '' : v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {FUEL_TYPES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Transmission</Label>
        <Select value={filters.transmission || 'all'} onValueChange={v => set('transmission', v === 'all' ? '' : v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {TRANSMISSION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Condition</Label>
        <Select value={filters.condition || 'all'} onValueChange={v => set('condition', v === 'all' ? '' : v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conditions</SelectItem>
            {CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {/* Listing Type — only visible when auctions feature is enabled */}
      {auctionsOn && (
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Listing Type</Label>
          <Select value={(filters as Record<string, unknown>).listing_type as string || 'all'} onValueChange={v => set('listing_type' as keyof CarFilters, v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Listings" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Listings</SelectItem>
              <SelectItem value="regular">Regular Listings</SelectItem>
              <SelectItem value="auction">Auction Listings</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex gap-2 pt-2 sticky bottom-0 bg-background pb-2 lg:hidden">
        <Button size="sm" onClick={() => onClose?.()} className="flex-1 h-9 border border-border">Done</Button>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { getSetting } = useSiteSettings();
  const { getBrandName, getModelName, getVariantName, brands } = useCarDatabase();
  const auctionsOn = getSetting('auctions_feature_enabled', 'true') !== 'false';
  const [showHints, setShowHints] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [savedSearchMsg, setSavedSearchMsg] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Parse filters from URL
  const filters: CarFilters = {
    search: searchParams.get('search') || '',
    make: searchParams.get('make') || '',
    brand_id: searchParams.get('brand_id') || '',
    model_id: searchParams.get('model_id') || '',
    variant_id: searchParams.get('variant_id') || '',
    body_type: searchParams.get('body_type') || '',
    city: searchParams.get('city') || '',
    fuel_type: searchParams.get('fuel_type') || '',
    transmission: searchParams.get('transmission') || '',
    condition: searchParams.get('condition') || '',
    year_min: searchParams.get('year_min') ? Number(searchParams.get('year_min')) : undefined,
    year_max: searchParams.get('year_max') ? Number(searchParams.get('year_max')) : undefined,
    price_min: searchParams.get('price_min') ? Number(searchParams.get('price_min')) : undefined,
    price_max: searchParams.get('price_max') ? Number(searchParams.get('price_max')) : undefined,
    listing_type: searchParams.get('listing_type') || undefined,
    status: 'active',
  };

  // Attempt to resolve brand_id from make if missing
  let resolvedBrandId = filters.brand_id;
  if (!resolvedBrandId && filters.make && brands.length > 0) {
    const found = brands.find(b => b.name.toLowerCase() === filters.make?.toLowerCase());
    if (found) resolvedBrandId = found.id;
  }

  const { cars, loading, total, pageSize } = useCars(filters, page);
  const totalPages = Math.ceil(total / pageSize);

  const setFilters = useCallback((newFilters: CarFilters | ((prev: CarFilters) => CarFilters)) => {
    setSearchParams(prevParams => {
      // First, get current filters from params
      const currentFilters: CarFilters = {
        search: prevParams.get('search') || '',
        brand_id: prevParams.get('brand_id') || '',
        model_id: prevParams.get('model_id') || '',
        variant_id: prevParams.get('variant_id') || '',
        body_type: prevParams.get('body_type') || '',
        city: prevParams.get('city') || '',
        fuel_type: prevParams.get('fuel_type') || '',
        transmission: prevParams.get('transmission') || '',
        condition: prevParams.get('condition') || '',
        year_min: prevParams.get('year_min') ? Number(prevParams.get('year_min')) : undefined,
        year_max: prevParams.get('year_max') ? Number(prevParams.get('year_max')) : undefined,
        price_min: prevParams.get('price_min') ? Number(prevParams.get('price_min')) : undefined,
        price_max: prevParams.get('price_max') ? Number(prevParams.get('price_max')) : undefined,
        listing_type: prevParams.get('listing_type') || undefined,
        status: 'active',
      };

      const updated = typeof newFilters === 'function' ? newFilters(currentFilters) : newFilters;
      
      const params = new URLSearchParams();
      Object.entries(updated).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && k !== 'status' && k !== 'limit' && k !== 'offset') {
          params.set(k, String(v));
        }
      });
      return params;
    }, { replace: true });
    setPage(1);
  }, [setSearchParams]);

  // Debounced keyword search
  const handleKeywordChange = (value: string) => {
    setFilters(f => ({ ...f, search: value }));
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPage(1), 400);
  };

  // AI Natural Language Search removed

  const saveSearch = async () => {
    if (!user) { navigate('/login'); return; }
    const name = filters.search || 'My Search';
    await supabase.from('saved_searches').insert({
      user_id: user.id,
      name,
      filters: filters as Record<string, unknown>,
      alert_enabled: true,
    });
    toast.success('Search saved! We\'ll alert you when new matches arrive.');
    setSavedSearchMsg(true);
    setTimeout(() => setSavedSearchMsg(false), 3000);
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== '' && v !== null && v !== 'active').length;

  const setFiltersAndReset = useCallback((f: CarFilters) => {
    setFilters(f);
  }, [setFilters]);

  const getFilterName = (key: string, value: any) => {
    if (key === 'brand_id') return getBrandName(value as string) || value;
    if (key === 'model_id') return getModelName(value as string) || value;
    if (key === 'variant_id') return getVariantName(value as string) || value;
    return String(value);
  };

  return (
    <PublicLayout>
      <div className="pt-[68px] min-h-screen">
        {/* Page header */}
        <div className="section-bg-dark-premium border-b border-border/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="section-label mb-1 text-primary-foreground/60">{t('inventory')}</p>
                <h1 className="text-2xl font-bold tracking-tight text-primary-foreground">
                  {loading ? 'Loading...' : `${total.toLocaleString()} Vehicles Available`}
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="flex gap-6">
            {/* Desktop filter sidebar */}
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-20">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filters</p>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="text-xs">{activeFilterCount}</Badge>
                  )}
                </div>
                <FilterPanel filters={filters} setFilters={setFiltersAndReset} auctionsOn={auctionsOn} />
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  {/* Mobile filter */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm" className="lg:hidden h-9 border border-border gap-2">
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                        {activeFilterCount > 0 && <Badge variant="secondary" className="text-xs ml-1">{activeFilterCount}</Badge>}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 overflow-y-auto">
                      <div className="pt-6">
                        <FilterPanel filters={filters} setFilters={setFiltersAndReset} onClose={() => {}} auctionsOn={auctionsOn} />
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Keyword search */}
                  <div className="relative hidden md:flex items-center">
                    <Search className="absolute left-3 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      value={filters.search || ''}
                      onChange={e => handleKeywordChange(e.target.value)}
                      onFocus={() => setShowHints(true)}
                      onBlur={() => setTimeout(() => setShowHints(false), 150)}
                      placeholder="Search by name, model..."
                      className="pl-9 h-9 w-52 text-sm"
                    />
                    {filters.search && (
                      <button onClick={() => handleKeywordChange('')} className="absolute right-3 text-muted-foreground hover:text-foreground">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {showHints && getSetting('ai_smart_search_enabled', 'true') !== 'false' && (
                      <AiSmartSearchHints
                        query={filters.search || ''}
                        onSelect={v => { handleKeywordChange(v); setShowHints(false); }}
                      />
                    )}
                  </div>

                  {/* Save search */}
                  <Button variant="ghost" size="sm" onClick={saveSearch}
                    className="h-9 gap-1.5 text-xs border border-border hidden md:flex">
                    {savedSearchMsg ? <BookmarkCheck className="w-3.5 h-3.5 text-[hsl(var(--gold))]" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                    {savedSearchMsg ? 'Saved!' : 'Save Search'}
                  </Button>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="icon" onClick={() => setViewMode('grid')}
                    className={cn('w-8 h-8', viewMode === 'grid' ? 'bg-secondary' : '')}>
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setViewMode('list')}
                    className={cn('w-8 h-8', viewMode === 'list' ? 'bg-secondary' : '')}>
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Active filter badges */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {Object.entries(filters).filter(([k, v]) => v && k !== 'status' && k !== 'limit' && k !== 'offset').map(([k, v]) => (
                    <Badge key={k} variant="secondary" className="gap-1 text-xs">
                      {k.replace('_', ' ')}: {getFilterName(k, v)}
                      <button onClick={() => setFiltersAndReset({ ...filters, [k]: undefined })} className="ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  <button onClick={() => setFiltersAndReset({ status: 'active' })} className="text-xs text-muted-foreground hover:text-foreground underline">
                    Clear all
                  </button>
                </div>
              )}

              {/* Results */}
              {loading ? (
                <CarSkeletonGrid count={PAGE_SIZE} />
              ) : cars.length === 0 ? (
                <div className="text-center py-20 border border-border rounded-xl">
                  <p className="text-muted-foreground mb-3">No vehicles match your filters.</p>
                  <Button variant="ghost" size="sm" onClick={() => setFiltersAndReset({ status: 'active' })}>Clear filters</Button>
                </div>
              ) : (
                <div className={cn(
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5'
                    : 'flex flex-col gap-3'
                )}>
                  {cars.map(car => <CarCard key={car.id} car={car} viewMode={viewMode} />)}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 border border-border">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page + i - 3;
                    if (p < 1 || p > totalPages) return null;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={cn('w-8 h-8 text-sm rounded-md transition-colors',
                          p === page ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary')}>
                        {p}
                      </button>
                    );
                  })}
                  <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 border border-border">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
