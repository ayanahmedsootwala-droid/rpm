import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ChevronRight, ArrowRight, Shield, Award, Clock, TrendingUp,
  Sparkles, MapPin, Star, ChevronLeft, Zap, Car as CarIcon, Gavel, Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { CarCard } from '@/components/cars/CarCard';
import { AuctionCard } from '@/components/auctions/AuctionCard';
import ChatWidget from '@/components/ChatWidget';
import { useCars } from '@/hooks/useCars';
import { useAuctions } from '@/hooks/useAuctions';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/db/supabase';
import type { CarBrand, Testimonial } from '@/types/types';
import { cn } from '@/lib/utils';

/* ── Animated counter ───────────────────────────────── */
function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || target === 0) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const step = target / (duration / 16);
      const timer = setInterval(() => {
        start = Math.min(start + step, target);
        setValue(Math.floor(start));
        if (start >= target) clearInterval(timer);
      }, 16);
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return { value, ref };
}

function AnimatedStat({ label, value, suffix = '+' }: { label: string; value: number; suffix?: string }) {
  const { value: animated, ref } = useCountUp(value);
  return (
    <div ref={ref} className="text-center">
      <p className="text-2xl md:text-3xl font-bold text-primary-foreground tracking-tight">
        {animated.toLocaleString()}{suffix}
      </p>
      <p className="text-xs text-primary-foreground/55 mt-1.5 tracking-wide uppercase font-medium">{label}</p>
    </div>
  );
}

/* ── Hero image presets (supercar backdrops) ────────── */
export const HERO_IMAGE_PRESETS = [
  {
    key: 'ferrari_night',
    label: 'Ferrari Night',
    url: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_b32fa7ad-ec67-4324-9e8f-b1af888c5599.jpg',
    overlay: 0.52,
  },
  {
    key: 'lamborghini_blue',
    label: 'Lamborghini',
    url: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_12158f18-9e61-4565-8a21-735637b390aa.jpg',
    overlay: 0.50,
  },
  {
    key: 'mclaren_gold',
    label: 'McLaren Gold',
    url: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_28dfc70b-068c-4135-b3aa-6f5ea3f692be.jpg',
    overlay: 0.48,
  },
  {
    key: 'porsche_dark',
    label: 'Porsche GT3',
    url: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_b12dc991-396c-49e2-a25d-cc1a6319feda.jpg',
    overlay: 0.54,
  },
  {
    key: 'bugatti_black',
    label: 'Bugatti',
    url: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_f6bb5cb1-0293-4589-808f-434bb012afe7.jpg',
    overlay: 0.50,
  },
  {
    key: 'gtr_japan',
    label: 'GTR Import',
    url: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_4d334303-2816-4366-a1cf-46da240317b1.jpg',
    overlay: 0.52,
  },
  {
    key: 'showroom',
    label: 'Showroom',
    url: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_69725dad-9fbf-4d53-94a8-b01dfc489923.jpg',
    overlay: 0.48,
  },
];

function renderMinimalHeadline(text: string) {
  // If the user's text doesn't contain a newline, split it evenly
  let lines = text.replace(/<br\s*\/?>/g, '\n').split('\n').filter(Boolean);
  if (lines.length === 1) {
    const words = text.split(' ');
    const mid = Math.ceil(words.length / 2);
    lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  }
  return lines.map((line, i) => {
    const words = line.trim().split(' ').filter(Boolean);
    return (
      <span key={i} className="block mb-2">
        {words.map((word, wIdx) => {
          if (wIdx === 0) return <span key={wIdx} className="text-white mr-3 inline-block">{word}</span>;
          if (wIdx === 1) return <span key={wIdx} className="text-red-600 mr-3 inline-block font-black">{word}</span>;
          return <span key={wIdx} className="text-white mr-3 inline-block">{word}</span>;
        })}
      </span>
    );
  });
}

/* ── Hero ───────────────────────────────────────────── */
function HeroSection() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { getSetting } = useSiteSettings();
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ cars: 0, auctions: 0, users: 0, sold: 0 });
  const [slideIdx, setSlideIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const heroTitle    = getSetting('hero_title',    'Find Your Perfect Drive');
  const heroSubtitle = getSetting('hero_subtitle', "Pakistan's most trusted platform for premium vehicles.");
  const heroPresetKey  = getSetting('hero_preset', 'ferrari_night');
  const heroCustomUrl  = getSetting('hero_image_url', '');
  const heroSlideshow  = getSetting('hero_slideshow_enabled', 'false') === 'true';
  const heroInterval   = parseInt(getSetting('hero_slideshow_interval', '5'), 10) * 1000;
  const heroOverlay    = parseFloat(getSetting('hero_overlay_opacity', '0.52'));
  const heroAlign      = getSetting('hero_align', 'left');
  const heroPaddingTop = getSetting('hero_padding_top', '8rem');
  const heroTitleColor = getSetting('hero_title_color', '#ffffff');
  const heroTitleSize  = getSetting('hero_title_size', 'clamp(2.4rem,6vw,4.5rem)');
  const heroTitleFont  = getSetting('hero_title_font', 'inherit');
  const heroTitleWeight = getSetting('hero_title_weight', '700');
  const heroSubtitleColor = getSetting('hero_subtitle_color', 'rgba(255, 255, 255, 0.55)');
  const heroSubtitleSize  = getSetting('hero_subtitle_size', '15px');
  const heroSearchbarPlacement = getSetting('hero_searchbar_placement', 'under_headline');
  const heroHeadlinePlacement  = getSetting('hero_headline_placement', 'center');
  const heroNavbarPlacement    = getSetting('hero_navbar_placement', 'transparent');
  const auctionsOn     = getSetting('auctions_feature_enabled', 'true') !== 'false';

  // Resolve active preset or custom URL
  const activePreset = HERO_IMAGE_PRESETS.find(p => p.key === heroPresetKey) || HERO_IMAGE_PRESETS[0];
  const slideshowImages = heroSlideshow
    ? HERO_IMAGE_PRESETS.map(p => p.url)
    : [heroCustomUrl || activePreset.url];

  const currentImage = slideshowImages[slideIdx % slideshowImages.length];
  const currentOverlay = heroSlideshow
    ? (HERO_IMAGE_PRESETS[slideIdx % HERO_IMAGE_PRESETS.length]?.overlay ?? heroOverlay)
    : (heroCustomUrl ? heroOverlay : activePreset.overlay);

  const advance = useCallback(() => {
    setSlideIdx(i => (i + 1) % slideshowImages.length);
  }, [slideshowImages.length]);

  const searchBarElement = heroSearchbarPlacement !== 'hidden' && (
    <div className={cn("flex gap-2 p-1.5 bg-white/8 backdrop-blur-md border border-white/14 rounded-xl w-full max-w-lg", {
      'mt-8': heroSearchbarPlacement === 'under_headline',
      'mx-auto': heroAlign === 'center' || heroSearchbarPlacement !== 'under_headline',
      'ml-auto': heroAlign === 'right' && heroSearchbarPlacement === 'under_headline',
    })}>
      <div className="flex-1 flex items-center gap-2 px-3">
        <Search className="w-4 h-4 text-white/40 shrink-0" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && navigate(`/inventory?search=${encodeURIComponent(search)}`)}
          placeholder={t('searchPlaceholder')}
          className="border-0 bg-transparent text-white placeholder:text-white/32 focus-visible:ring-0 text-sm h-9 px-0"
        />
      </div>
      <Button
        onClick={() => navigate(`/inventory?search=${encodeURIComponent(search)}`)}
        size="sm"
        className="bg-[hsl(var(--gold))] text-[hsl(var(--gold-foreground))] hover:bg-[hsl(38_80%_36%)] h-9 px-5 shrink-0 font-semibold"
      >
        Search
      </Button>
    </div>
  );

  useEffect(() => {
    if (heroSlideshow && slideshowImages.length > 1) {
      timerRef.current = setInterval(advance, heroInterval);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [heroSlideshow, heroInterval, advance, slideshowImages.length]);

  useEffect(() => {
    Promise.all([
      supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('auctions').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
    ]).then(([cars, auctions, users, sold]) => {
      setStats({ cars: cars.count || 0, auctions: auctions.count || 0, users: users.count || 0, sold: sold.count || 0 });
    });
  }, []);

  return (
<section className="relative min-h-[120vh] flex flex-col justify-center overflow-hidden bg-black pt-[10vh] pb-[5vh]">
      {/* Slideshow backdrop images */}
      {HERO_IMAGE_PRESETS.map((p, i) => (
        <img
          key={p.key}
          src={p.url}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-1000 grayscale-[0.2]"
          style={{ opacity: heroSlideshow
            ? (slideIdx % HERO_IMAGE_PRESETS.length === i ? 1 : 0)
            : (p.key === heroPresetKey ? 1 : 0) }}
        />
      ))}
      {/* Custom URL override */}
      {!heroSlideshow && heroCustomUrl && (
        <img src={heroCustomUrl} alt="" aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none grayscale-[0.2]" />
      )}

      {/* Solid Dark Overlay for Premium Minimal Contrast */}
      <div className="absolute inset-0 pointer-events-none bg-black/60" aria-hidden="true" />

      {/* Slideshow dots */}
      {heroSlideshow && slideshowImages.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/5">
          {slideshowImages.map((_, i) => (
            <button key={i} onClick={() => setSlideIdx(i)}
              className={cn('rounded-full transition-all duration-300', i === slideIdx % slideshowImages.length
                ? 'w-6 h-1.5 bg-red-600' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/80')}
              aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
      )}

      <div className="relative max-w-5xl mx-auto px-4 md:px-8 w-full z-20 flex flex-col items-center justify-center text-center mt-8">
        {/* Top Badges Container */}
        {auctionsOn && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {/* Auction live badge */}
            <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 backdrop-blur-md rounded-full px-5 py-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500 live-dot shrink-0" />
              <span className="text-xs text-white/80 font-semibold tracking-widest uppercase">Live Auctions Active</span>
            </div>
          </div>
        )}

        {/* Elegant Headline */}
        <div className="flex flex-col items-center justify-center gap-1 w-full mb-8 mt-4">
          <h1 className="text-white font-black italic uppercase tracking-[0.2em] md:text-5xl text-3xl drop-shadow-2xl" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            DRIVE EXCELLENCE
          </h1>
          <h2 className="text-red-600 font-black italic uppercase tracking-[0.2em] md:text-4xl text-2xl drop-shadow-2xl" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            LIVE THE DIFFERENCE
          </h2>
        </div>

        {/* Decorative accent rule & Subtitle */}
        <div className="flex flex-col items-center justify-center gap-4 mb-12 max-w-2xl">
          <div className="h-[2px] w-12 bg-red-600 shrink-0" />
          <p className="leading-relaxed text-pretty text-white/80 text-lg font-medium tracking-wide">
            {heroSubtitle}
          </p>
        </div>

        {/* Search bar & Action Buttons */}
        <div className="w-full max-w-3xl flex flex-col items-center">
          {searchBarElement}
          
          <div className="flex flex-wrap justify-center gap-5 mt-10 w-full">
            <Button onClick={() => navigate('/inventory')} className="bg-white hover:bg-gray-100 text-black h-14 px-10 font-bold rounded-none tracking-wide uppercase text-sm transition-transform hover:scale-105 shadow-xl">
              Browse Inventory
            </Button>
            <Button onClick={() => navigate('/sell')} variant="ghost" className="bg-black/30 hover:bg-red-600 text-white border border-white/20 hover:border-red-600 h-14 px-10 font-bold rounded-none tracking-wide uppercase text-sm transition-all hover:scale-105 backdrop-blur-md shadow-xl">
              Sell Your Car
            </Button>
          </div>
        </div>

        {/* Quick type filters */}
        <div className="flex flex-wrap justify-center gap-3 mt-12">
          {['SUV', 'Sedan', 'Hatchback', 'Pickup', 'Luxury', 'Electric'].map(type => (
            <button key={type} onClick={() => navigate(`/inventory?body_type=${type}`)}
              className="text-xs text-white/60 hover:text-white border border-white/15 hover:border-white/40 rounded-full px-5 py-1.5 transition-all duration-300 hover:bg-white/10 backdrop-blur-md font-medium tracking-wide">
              {type}
            </button>
          ))}
        </div>

        {/* Stats strip */}
        {[
          { key: 'show_stat_vehicles', label: 'Vehicles Listed', value: stats.cars },
          { key: 'show_stat_buyers',   label: 'Happy Buyers',    value: stats.users },
          { key: 'show_stat_auctions', label: 'Auctions Held',   value: stats.auctions },
          { key: 'show_stat_sold',     label: 'Cars Sold',       value: stats.sold },
        ].some(s => getSetting(s.key, 'true') !== 'false') && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mt-20 pt-10 border-t border-white/10 w-full max-w-4xl">
            {[
              { key: 'show_stat_vehicles', label: 'Vehicles Listed', value: stats.cars },
              { key: 'show_stat_buyers',   label: 'Happy Buyers',    value: stats.users },
              { key: 'show_stat_auctions', label: 'Auctions Held',   value: stats.auctions },
              { key: 'show_stat_sold',     label: 'Cars Sold',       value: stats.sold },
            ].filter(s => getSetting(s.key, 'true') !== 'false').map((s) => (
              <AnimatedStat key={s.key} label={s.label} value={s.value} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Brand ticker ───────────────────────────────────── */
function BrandCarousel() {
  const { t } = useLanguage();
  const [brands, setBrands] = useState<CarBrand[]>([]);
  useEffect(() => {
    supabase.from('car_brands').select('*').eq('is_active', true).order('name').limit(24)
      .then(({ data }) => { if (data) setBrands(data as CarBrand[]); });
  }, []);
  if (brands.length === 0) return null;
  const doubled = [...brands, ...brands];

  return (
    <section className="py-12 border-y border-border bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-5">
        <p className="section-label text-center">Trusted Brands</p>
      </div>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        <div className="flex gap-4 animate-ticker" style={{ width: 'max-content' }}>
          {doubled.map((b, i) => (
            <Link to={`/inventory?make=${encodeURIComponent(b.name)}`} key={`${b.id}-${i}`}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-border hover:border-foreground/20 bg-card hover:bg-secondary transition-all duration-200 shrink-0">
              {b.logo_url
                ? <img src={b.logo_url} alt={b.name} className="w-6 h-6 object-contain" loading="lazy" />
                : <div className="w-6 h-6 bg-muted rounded flex items-center justify-center text-foreground text-[10px] font-bold shrink-0">{b.name.charAt(0)}</div>
              }
              <span className="text-sm font-medium text-foreground whitespace-nowrap">{b.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Featured Cars ──────────────────────────────────── */
function FeaturedCars() {
  const { cars, loading } = useCars({ status: 'active', limit: 6 });
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 opacity-0 intersect:opacity-100 transition-all duration-700">
          <div>
            <p className="section-label mb-2">Featured Vehicles</p>
            <h2 className="section-heading">Handpicked for You</h2>
            <p className="section-subheading mt-2">Curated selection of verified, top-condition vehicles.</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/inventory')} className="text-sm shrink-0 self-start md:self-auto gap-1.5 text-muted-foreground hover:text-foreground">
            View all inventory <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden h-full">
                <Skeleton className="aspect-[4/3] w-full bg-muted" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4 bg-muted" />
                  <Skeleton className="h-4 w-1/2 bg-muted" />
                  <Skeleton className="h-8 w-full bg-muted" />
                </div>
              </Card>
            ))
            : cars.map((car, i) => (
              <div key={car.id} className={cn('h-full opacity-0 intersect:opacity-100 transition-all duration-700',
                i % 3 === 1 ? 'intersect:delay-100' : i % 3 === 2 ? 'intersect:delay-200' : '')}>
                <CarCard car={car} />
              </div>
            ))
          }
        </div>
      </div>
    </section>
  );
}

/* ── Live Auctions ──────────────────────────────────── */
function LiveAuctions() {
  const { auctions, loading } = useAuctions({ status: 'active', limit: 3 });
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-24 bg-secondary/40">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 opacity-0 intersect:opacity-100 transition-all duration-700">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 live-dot" />
              <p className="section-label">Live Now</p>
            </div>
            <h2 className="section-heading">Active Auctions</h2>
            <p className="section-subheading mt-2">Bid on exclusive vehicles in real time. Secure your dream car today.</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/auctions')} className="text-sm shrink-0 self-start md:self-auto gap-1.5 text-muted-foreground hover:text-foreground">
            All auctions <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1,2,3].map(i => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full bg-muted" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4 bg-muted" /><Skeleton className="h-4 w-1/2 bg-muted" />
                </div>
              </Card>
            ))}
          </div>
        ) : auctions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-border rounded-2xl text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <Gavel className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No live auctions right now</p>
            <Button variant="ghost" size="sm" onClick={() => navigate('/auctions')} className="text-sm gap-1.5">
              View upcoming auctions <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {auctions.map((a, i) => (
              <div key={a.id} className={cn('opacity-0 intersect:opacity-100 transition-all duration-700',
                i === 1 ? 'intersect:delay-100' : i === 2 ? 'intersect:delay-200' : '')}>
                <AuctionCard auction={a} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Browse by type ─────────────────────────────────── */
function BrowseByType() {
  const navigate = useNavigate();
  const types = [
    { label: 'Sedans',     icon: CarIcon, type: 'Sedan',     desc: 'Comfort & efficiency' },
    { label: 'SUVs',       icon: CarIcon, type: 'SUV',       desc: 'Space & performance' },
    { label: 'Hatchbacks', icon: CarIcon, type: 'Hatchback', desc: 'City-friendly drives' },
    { label: 'Pickups',    icon: CarIcon, type: 'Pickup',    desc: 'Work & adventure' },
  ];
  return (
    <section className="py-16 md:py-24 bg-foreground">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10 opacity-0 intersect:opacity-100 transition-all duration-700">
          <p className="section-label mb-2 text-[hsl(var(--gold))]">Browse By Type</p>
          <h2 className="section-heading mx-auto text-background">Find Your Category</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {types.map((type, i) => (
            <button key={type.type} onClick={() => navigate(`/inventory?body_type=${type.type}`)}
              className={cn(
                'group relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-background/10',
                'hover:border-background/25 hover:bg-background/8 transition-all duration-300',
                'opacity-0 intersect:opacity-100 transition-all duration-700',
                i >= 2 ? 'intersect:delay-150' : ''
              )}>
              <div className="w-12 h-12 rounded-xl bg-background/10 flex items-center justify-center transition-all duration-300 group-hover:bg-[hsl(var(--gold)/0.15)]">
                <type.icon className="w-5 h-5 text-background/50 group-hover:text-[hsl(var(--gold))] transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-background">{type.label}</p>
                <p className="text-xs text-background/55 mt-0.5">{type.desc}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-background/40 absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Why Us ─────────────────────────────────────────── */
function WhyUs() {
  const { getSetting } = useSiteSettings();
  const siteName = getSetting('site_name', 'XYZ Automobiles');
  const features = [
    { icon: Shield,     title: 'Verified Listings',    desc: 'Every vehicle is inspected and verified by our expert team before listing.' },
    { icon: Zap,        title: 'Real-Time Auctions',   desc: 'Live bidding with instant updates, automated timers, and proxy bids.' },
    { icon: Award,      title: 'Certified Dealerships',desc: 'Partner dealerships are certified and rated by thousands of buyers.' },
    { icon: TrendingUp, title: 'AI Car Advisor',       desc: 'Ask questions about any listing — get specs, reliability tips, and buying advice instantly.' },
    { icon: MapPin,     title: 'Pakistan-Wide',        desc: 'Serving buyers and sellers across all major Pakistani cities.' },
    { icon: Clock,      title: 'Smart Comparison',     desc: 'AI-powered side-by-side comparison with pros, cons, and a clear recommendation.' },
  ];
  return (
    <section className="py-16 md:py-24 bg-foreground">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12 opacity-0 intersect:opacity-100 transition-all duration-700">
          <p className="section-label mb-2 text-[hsl(var(--gold))]">Why {siteName}</p>
          <h2 className="section-heading mx-auto text-background">Built for Pakistan's Car Market</h2>
          <p className="section-subheading mt-3 mx-auto text-center text-background/60">
            Everything you need to buy, sell, and discover vehicles with confidence.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={f.title}
              className={cn(
                'group p-6 rounded-xl border border-background/10 hover:border-background/25 transition-all duration-300 bg-background/5 hover:bg-background/8',
                'opacity-0 intersect:opacity-100 transition-all duration-700',
                i >= 3 ? 'intersect:delay-100' : ''
              )}>
              <div className="w-9 h-9 bg-background/10 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-[hsl(var(--gold)/0.15)]">
                <f.icon className="w-4 h-4 text-[hsl(var(--gold))]" />
              </div>
              <h3 className="text-sm font-semibold text-background mb-1.5">{f.title}</h3>
              <p className="text-sm text-background/60 leading-relaxed text-pretty">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ───────────────────────────────────── */
function TestimonialsSection() {
  const { t } = useLanguage();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    supabase.from('testimonials').select('*').eq('is_active', true)
      .order('display_order').limit(8)
      .then(({ data }) => { if (data) setTestimonials(data as Testimonial[]); });
  }, []);
  if (testimonials.length === 0) return null;
  const item = testimonials[idx];

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-2xl mx-auto px-4 md:px-6 text-center">
        <p className="section-label mb-2">Testimonials</p>
        <h2 className="section-heading mx-auto mb-12">{t('testimonials')}</h2>
        <div className="animate-fade-in" key={idx}>
          <div className="text-5xl leading-none text-[hsl(var(--gold))] mb-5 select-none font-serif">"</div>
          <p className="text-[15px] md:text-base text-foreground/80 leading-relaxed text-pretty mb-8 max-w-xl mx-auto">
            {item.content ?? item.testimonial_text ?? ''}
          </p>
          <div className="flex items-center justify-center gap-1 mb-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={cn('w-4 h-4', i < (item.rating ?? 5) ? 'text-[hsl(var(--gold))] fill-[hsl(var(--gold))]' : 'text-border')} />
            ))}
          </div>
          <div className="flex items-center justify-center gap-3">
            {item.avatar_url && (
              <img src={item.avatar_url} alt={item.author_name ?? item.customer_name ?? ''} className="w-9 h-9 rounded-full object-cover border border-border" />
            )}
            <div className="text-left">
              <p className="text-sm font-semibold">{item.author_name ?? item.customer_name}</p>
              {(item.author_title ?? item.customer_title) && (
                <p className="text-xs text-muted-foreground">{item.author_title ?? item.customer_title}</p>
              )}
            </div>
          </div>
        </div>
        {testimonials.length > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <Button variant="ghost" size="icon"
              onClick={() => setIdx(i => (i - 1 + testimonials.length) % testimonials.length)}
              className="w-8 h-8 border border-border text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex gap-1.5">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)}
                  className={cn('h-1.5 rounded-full transition-all duration-300', i === idx ? 'w-5 bg-foreground' : 'w-1.5 bg-border hover:bg-muted-foreground')} />
              ))}
            </div>
            <Button variant="ghost" size="icon"
              onClick={() => setIdx(i => (i + 1) % testimonials.length)}
              className="w-8 h-8 border border-border text-muted-foreground hover:text-foreground">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── CTA ────────────────────────────────────────────── */
function CtaSection() {
  const navigate = useNavigate();
  return (
    <section className="py-16 md:py-24 bg-secondary/40">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="relative overflow-hidden rounded-2xl p-8 md:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 opacity-0 intersect:opacity-100 transition-all duration-700"
          style={{ background: 'var(--gradient-hero)' }}>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -right-24 -top-24 w-64 h-64 rounded-full opacity-[0.07]"
              style={{ background: 'radial-gradient(circle, hsl(38 80% 48%) 0%, transparent 70%)' }} />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />
              <span className="section-label">AI-Powered Platform</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground text-balance mb-2 tracking-tight">
              Ready to Sell Your Car?
            </h2>
            <p className="text-primary-foreground/60 text-sm max-w-sm text-pretty leading-relaxed">
              List for free. AI-generated descriptions, smart pricing, and reach thousands of verified buyers across Pakistan.
            </p>
          </div>
          <div className="relative flex flex-col sm:flex-row gap-3 shrink-0">
            <Button onClick={() => navigate('/sell')} variant="ghost"
              className="border border-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/10 font-semibold px-6 h-10 gap-2">
              Sell Your Car <ArrowRight className="w-4 h-4" />
            </Button>
            <Button onClick={() => navigate('/inventory')} variant="ghost"
              className="border border-primary-foreground/15 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/8 px-6 h-10 gap-2">
              Browse Inventory
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Page ───────────────────────────────────────────── */
function AiChatGate() {
  const { getSetting } = useSiteSettings();
  if (getSetting('ai_chat_enabled', 'true') === 'false') return null;
  return <ChatWidget />;
}

function HomeSections() {
  const { getSetting } = useSiteSettings();
  const auctionsFeatureOn = getSetting('auctions_feature_enabled', 'true') !== 'false';
  return (
    <>
      {getSetting('show_brand_carousel', 'true') !== 'false' && <BrandCarousel />}
      {getSetting('show_featured_cars', 'true') !== 'false' && <FeaturedCars />}
      {auctionsFeatureOn && getSetting('show_auctions_section', 'true') !== 'false' && <LiveAuctions />}
      {getSetting('show_browse_by_type', 'true') !== 'false' && <BrowseByType />}
      {getSetting('show_why_us', 'true') !== 'false' && <WhyUs />}
      {getSetting('show_testimonials', 'true') !== 'false' && <TestimonialsSection />}
    </>
  );
}

export default function HomePage() {
  return (
    <PublicLayout>
      <HeroSection />
      <div className="hero-bottom-bridge" aria-hidden="true" />
      <HomeSections />
      <CtaSection />
      <AiChatGate />
    </PublicLayout>
  );
}
