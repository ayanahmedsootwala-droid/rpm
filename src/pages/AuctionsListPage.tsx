import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuctions } from '@/hooks/useAuctions';
import { AuctionCard } from '@/components/auctions/AuctionCard';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Gavel, SlidersHorizontal, Search, Clock, TrendingUp, Zap, CalendarClock, X } from 'lucide-react';
import type { AuctionFilters } from '@/types/types';
import { formatCurrency } from '@/lib/utils-xyz';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/db/supabase';

type StatusTab = 'active' | 'scheduled' | 'ended' | 'all';

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 live-dot inline-block" />LIVE
    </span>
  );
}

const PRICE_MAX = 15000000;

export default function AuctionsListPage() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<StatusTab>('active');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<AuctionFilters['sortBy']>('ending_soon');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, PRICE_MAX]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [counts, setCounts] = useState({ active: 0, scheduled: 0, ended: 0 });

  const filters: AuctionFilters = {
    status: status === 'all' ? undefined : status,
    sortBy,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < PRICE_MAX ? priceRange[1] : undefined,
  };
  const { auctions, loading, refetch } = useAuctions(filters, 24);

  useEffect(() => { loadCounts(); }, []);
  async function loadCounts() {
    const [a, s, e] = await Promise.all([
      supabase.from('auctions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('auctions').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
      supabase.from('auctions').select('id', { count: 'exact', head: true }).eq('status', 'ended'),
    ]);
    setCounts({ active: a.count || 0, scheduled: s.count || 0, ended: e.count || 0 });
  }

  const filtered = search
    ? auctions.filter(a => a.title?.toLowerCase().includes(search.toLowerCase()) || a.car?.brand_name?.toLowerCase().includes(search.toLowerCase()))
    : auctions;

  const hasActiveFilters = priceRange[0] > 0 || priceRange[1] < PRICE_MAX;

  function resetFilters() { setPriceRange([0, PRICE_MAX]); setSearch(''); }

  const FilterPanel = () => (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{t('sortBy')}</p>
        <Select value={sortBy} onValueChange={v => setSortBy(v as AuctionFilters['sortBy'])}>
          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ending_soon"><span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" />Ending Soon</span></SelectItem>
            <SelectItem value="newest"><span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5" />Newest First</span></SelectItem>
            <SelectItem value="bid_asc"><span className="flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" />Lowest Bid</span></SelectItem>
            <SelectItem value="bid_desc"><span className="flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 rotate-180" />Highest Bid</span></SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Bid Range</p>
        <div className="px-1">
          <Slider
            value={priceRange} min={0} max={PRICE_MAX} step={100000}
            onValueChange={v => setPriceRange(v as [number, number])}
            className="mb-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(priceRange[0])}</span>
            <span>{priceRange[1] >= PRICE_MAX ? 'No max' : formatCurrency(priceRange[1])}</span>
          </div>
        </div>
      </div>
      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={resetFilters} className="w-full">
          <X className="w-3.5 h-3.5 mr-1" />Reset Filters
        </Button>
      )}
    </div>
  );

  return (
    <PublicLayout>
      <div className="pt-[68px] min-h-screen">
        {/* Hero banner */}
        <div className="section-bg-dark-premium py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Gavel className="w-5 h-5 text-gold" />
              <span className="section-label">Live Auction House</span>
            </div>
            <h1 className="text-white text-3xl md:text-4xl font-bold tracking-tight text-balance">Bid on Exclusive Vehicles</h1>
            <p className="text-white/60 mt-3 text-sm max-w-lg mx-auto">Real-time bidding on premium and imported cars across Pakistan. Secure, transparent, and fair.</p>
            <div className="flex items-center justify-center gap-6 mt-6 text-sm">
              <div className="text-center"><p className="text-white font-bold text-xl">{counts.active}</p><p className="text-white/50 text-xs">Live Now</p></div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center"><p className="text-white font-bold text-xl">{counts.scheduled}</p><p className="text-white/50 text-xs">Upcoming</p></div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center"><p className="text-white font-bold text-xl">{counts.ended}</p><p className="text-white/50 text-xs">Completed</p></div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* Status tabs */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {([
              { key: 'active' as StatusTab, label: 'Live', icon: Zap, count: counts.active },
              { key: 'scheduled' as StatusTab, label: 'Upcoming', icon: CalendarClock, count: counts.scheduled },
              { key: 'ended' as StatusTab, label: 'Ended', icon: Clock, count: counts.ended },
              { key: 'all' as StatusTab, label: 'All', icon: Gavel, count: counts.active + counts.scheduled + counts.ended },
            ] as const).map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => setStatus(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  status === key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-gold/40 hover:text-foreground'
                }`}
              >
                {key === 'active' && status === 'active' ? <LiveBadge /> : <Icon className="w-3.5 h-3.5" />}
                {key !== 'active' && label}
                {count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${status === key ? 'bg-primary-foreground/20' : 'bg-secondary'}`}>{count}</span>}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search auctions…" className="pl-9 h-9 w-52 text-sm" />
                {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" /></button>}
              </div>

              {/* Mobile filter sheet */}
              <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-9">
                    <SlidersHorizontal className="w-3.5 h-3.5" />Filters
                    {hasActiveFilters && <Badge className="bg-gold text-gold-foreground text-xs px-1.5 py-0 h-4">{[priceRange[0] > 0, priceRange[1] < PRICE_MAX].filter(Boolean).length}</Badge>}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <SheetHeader><SheetTitle>Filter Auctions</SheetTitle></SheetHeader>
                  <div className="mt-6"><FilterPanel /></div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Mobile search */}
          <div className="md:hidden mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search auctions…" className="pl-9 text-sm" />
          </div>

          {/* Active filters row */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {priceRange[0] > 0 && <Badge variant="secondary" className="text-xs gap-1">Min: {formatCurrency(priceRange[0])}<button onClick={() => setPriceRange([0, priceRange[1]])}><X className="w-3 h-3" /></button></Badge>}
              {priceRange[1] < PRICE_MAX && <Badge variant="secondary" className="text-xs gap-1">Max: {formatCurrency(priceRange[1])}<button onClick={() => setPriceRange([priceRange[0], PRICE_MAX])}><X className="w-3 h-3" /></button></Badge>}
              <button onClick={resetFilters} className="text-xs text-destructive hover:underline">Clear all</button>
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[4/3] w-full rounded-xl bg-muted" />
                  <Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <Gavel className="w-14 h-14 mx-auto text-muted-foreground opacity-20 mb-4" />
              <p className="text-lg font-medium">{search ? 'No auctions match your search' : `No ${status === 'all' ? '' : status} auctions right now`}</p>
              <p className="text-sm text-muted-foreground mt-1.5">
                {status === 'active' ? 'Check back soon for upcoming auctions.' : 'Try a different filter or status.'}
              </p>
              {(search || hasActiveFilters) && <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>Clear Filters</Button>}
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">{filtered.length} auction{filtered.length !== 1 ? 's' : ''} {status === 'active' ? 'currently live' : ''}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map(a => <AuctionCard key={a.id} auction={a} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
