import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Check, X, ArrowLeft, Plus, Printer, Share2,
  Gauge, Fuel, Settings, Car, MapPin, Calendar, Palette,
  ChevronDown, ChevronUp, Star, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { useCompare } from '@/contexts/CompareContext';
import { supabase } from '@/db/supabase';
import { formatCurrency, formatMileage } from '@/lib/utils-xyz';
import type { Car as CarType } from '@/types/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import AiCompareSummary from '@/components/ai/AiCompareSummary';

const SPEC_GROUPS = [
  {
    label: 'Pricing',
    icon: Star,
    fields: [
      { label: 'Price', key: 'price' as keyof CarType, format: (v: unknown) => v ? formatCurrency(v as number) : '—', highlight: 'low' },
      { label: 'Negotiable', key: 'is_negotiable' as keyof CarType, format: (v: unknown) => v ? 'Yes' : 'No' },
    ],
  },
  {
    label: 'Basic Info',
    icon: Car,
    fields: [
      { label: 'Year', key: 'year' as keyof CarType, format: (v: unknown) => v ? String(v) : '—', highlight: 'high' },
      { label: 'Brand', key: 'brand_name' as keyof CarType, format: (v: unknown) => v ? String(v) : '—' },
      { label: 'Model', key: 'model_name' as keyof CarType, format: (v: unknown) => v ? String(v) : '—' },
      { label: 'Variant', key: 'variant_name' as keyof CarType, format: (v: unknown) => v ? String(v) : '—' },
      { label: 'Body Type', key: 'body_type' as keyof CarType, format: (v: unknown) => v ? String(v) : '—' },
      { label: 'Condition', key: 'condition' as keyof CarType, format: (v: unknown) => v ? String(v) : '—' },
      { label: 'Assembly', key: 'assembly' as keyof CarType, format: (v: unknown) => v ? String(v) : '—' },
    ],
  },
  {
    label: 'Performance',
    icon: Gauge,
    fields: [
      { label: 'Engine', key: 'engine_size' as keyof CarType, format: (v: unknown) => v ? String(v) : '—' },
      { label: 'Cylinders', key: 'cylinders' as keyof CarType, format: (v: unknown) => v ? `${v} cyl` : '—' },
      { label: 'Drive Type', key: 'drive_type' as keyof CarType, format: (v: unknown) => v ? String(v) : '—' },
    ],
  },
  {
    label: 'Fuel & Transmission',
    icon: Fuel,
    fields: [
      { label: 'Fuel Type', key: 'fuel_type' as keyof CarType, format: (v: unknown) => v ? String(v) : '—' },
      { label: 'Transmission', key: 'transmission' as keyof CarType, format: (v: unknown) => v ? String(v) : '—' },
      { label: 'Mileage', key: 'mileage' as keyof CarType, format: (v: unknown) => v ? formatMileage(v as number) : '—', highlight: 'low' },
    ],
  },
  {
    label: 'Dimensions',
    icon: Settings,
    fields: [
      { label: 'Doors', key: 'doors' as keyof CarType, format: (v: unknown) => v ? `${v} doors` : '—' },
      { label: 'Seats', key: 'seating_capacity' as keyof CarType, format: (v: unknown) => v ? `${v} seats` : '—' },
      { label: 'Color', key: 'color' as keyof CarType, format: (v: unknown) => v ? String(v) : '—' },
    ],
  },
  {
    label: 'Location',
    icon: MapPin,
    fields: [
      { label: 'City', key: 'city' as keyof CarType, format: (v: unknown) => v ? String(v) : '—' },
      { label: 'Registration City', key: 'registration_city' as keyof CarType, format: (v: unknown) => v ? String(v) : '—' },
    ],
  },
];

function formatVal(key: keyof CarType, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (key === 'price') return formatCurrency(value as number);
  if (key === 'mileage') return formatMileage(value as number);
  if (key === 'is_negotiable') return value ? 'Yes' : 'No';
  return String(value);
}

export default function ComparePage() {
  const { t } = useLanguage();
  const { getSetting } = useSiteSettings();
  const [searchParams] = useSearchParams();
  const ids = (searchParams.get('ids') || '').split(',').filter(Boolean).slice(0, 3);
  const [cars, setCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const { removeFromCompare } = useCompare();

  useEffect(() => {
    if (!ids.length) { setLoading(false); return; }
    supabase.from('cars').select('*').in('id', ids)
      .then(({ data }) => {
        if (data) {
          const ordered = ids.map(id => (data as CarType[]).find(c => c.id === id)).filter(Boolean) as CarType[];
          setCars(ordered);
        }
        setLoading(false);
      });
  }, [ids.join(',')]);

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  };

  const handlePrint = () => window.print();

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Compare link copied!');
  };

  const getBestIdx = (values: unknown[], highlight?: string): number => {
    if (!highlight) return -1;
    const nums = values.map(v => typeof v === 'number' ? v : parseFloat(String(v || 0)));
    if (nums.some(isNaN)) return -1;
    return highlight === 'low' ? nums.indexOf(Math.min(...nums)) : nums.indexOf(Math.max(...nums));
  };

  const featureCount = (car: CarType) => Array.isArray(car.features) ? car.features.length : 0;

  return (
    <PublicLayout>
      {/* Dark hero header */}
      <div className="section-bg-dark-premium border-b border-border/20 pt-[68px]">
        {/* AI Compare Summary */}
      {!loading && cars.length >= 2 && getSetting('ai_compare_enabled', 'true') !== 'false' && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
          <AiCompareSummary cars={cars} />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild className="gap-1.5 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10">
                <Link to="/inventory"><ArrowLeft className="w-4 h-4" /> Back to Inventory</Link>
              </Button>
              <Separator orientation="vertical" className="h-5 bg-white/20" />
              <div>
                <h1 className="text-xl font-bold text-primary-foreground">Compare Vehicles</h1>
                <p className="text-xs text-primary-foreground/60 mt-0.5">{cars.length} vehicle{cars.length !== 1 ? 's' : ''} selected for comparison</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1.5 h-8 border border-white/20 text-white hover:bg-white/10">
                <Share2 className="w-3.5 h-3.5" /> Share
              </Button>
              <Button variant="ghost" size="sm" onClick={handlePrint} className="gap-1.5 h-8 border border-white/20 text-white hover:bg-white/10">
                <Printer className="w-3.5 h-3.5" /> Print
              </Button>
              {cars.length < 3 && (
                <Button size="sm" asChild className="gap-1.5 h-8 bg-white/10 hover:bg-white/20 text-white border border-white/20">
                  <Link to="/inventory"><Plus className="w-3.5 h-3.5" /> Add Vehicle</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4 space-y-3">
                  <Skeleton className="h-40 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                </CardContent></Card>
              ))}
            </div>
          </div>
        ) : cars.length < 2 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 mx-auto bg-muted rounded-2xl flex items-center justify-center mb-4">
              <Car className="w-8 h-8 text-muted-foreground opacity-40" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Select Vehicles to Compare</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Browse our inventory and add at least 2 vehicles to start comparing specs side by side.
            </p>
            <Button asChild className="gap-2">
              <Link to="/inventory"><ArrowRight className="w-4 h-4" /> Browse Inventory</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Car cards row */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${cars.length}, 1fr)` }}>
              <div /> {/* spacer for label column */}
              {cars.map(car => (
                <Card key={car.id} className="h-full overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative">
                    {Array.isArray(car.images) && car.images[0] ? (
                      <img src={car.images[0]} alt={car.title} className="w-full h-36 object-cover" />
                    ) : (
                      <div className="w-full h-36 bg-muted flex items-center justify-center text-muted-foreground/30">
                        <Car className="w-10 h-10" />
                      </div>
                    )}
                    <Button
                      variant="ghost" size="icon"
                      className="absolute top-2 right-2 w-7 h-7 bg-black/40 hover:bg-black/60 text-white rounded-full"
                      onClick={() => setCars(prev => prev.filter(c => c.id !== car.id))}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                    {car.condition === 'New' && (
                      <Badge className="absolute top-2 left-2 text-xs bg-green-600 text-white">New</Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">{car.brand_name}</p>
                    <p className="font-bold text-base text-foreground">{car.year} {car.model_name}</p>
                    {car.variant_name && <p className="text-xs text-muted-foreground">{car.variant_name}</p>}
                    <p className="text-lg font-bold text-primary mt-2">{formatCurrency(car.price)}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {car.fuel_type && <Badge variant="secondary" className="text-[10px]">{car.fuel_type}</Badge>}
                      {car.transmission && <Badge variant="secondary" className="text-[10px]">{car.transmission}</Badge>}
                    </div>
                    <Button size="sm" className="w-full mt-3 h-8 text-xs" asChild>
                      <Link to={`/car/${car.id}`}>View Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Spec groups */}
            {SPEC_GROUPS.map(group => (
              <Card key={group.label} className="overflow-hidden">
                <CardHeader
                  className="py-3 px-4 cursor-pointer hover:bg-muted/30 transition-colors select-none"
                  onClick={() => toggleGroup(group.label)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                        <group.icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <CardTitle className="text-sm font-semibold">{group.label}</CardTitle>
                    </div>
                    {collapsedGroups.has(group.label)
                      ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      : <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    }
                  </div>
                </CardHeader>

                {!collapsedGroups.has(group.label) && (
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[500px]">
                        <colgroup>
                          <col style={{ width: '200px' }} />
                          {cars.map(c => <col key={c.id} />)}
                        </colgroup>
                        <tbody>
                          {group.fields.map((field, fIdx) => {
                            const values = cars.map(c => c[field.key]);
                            const bestIdx = 'highlight' in field ? getBestIdx(values, field.highlight) : -1;
                            const allSame = values.every(v => String(v ?? '') === String(values[0] ?? ''));

                            return (
                              <tr key={field.key} className={fIdx % 2 === 0 ? 'bg-muted/20' : ''}>
                                <td className="py-2.5 px-4 text-xs text-muted-foreground font-medium whitespace-nowrap border-r border-border/40">
                                  {field.label}
                                </td>
                                {cars.map((car, ci) => {
                                  const raw = car[field.key];
                                  const display = 'format' in field && typeof field.format === 'function'
                                    ? field.format(raw)
                                    : formatVal(field.key, raw);
                                  const isBest = ci === bestIdx && !allSame;

                                  return (
                                    <td key={car.id} className={cn(
                                      'py-2.5 px-4 text-center text-sm whitespace-nowrap',
                                      isBest ? 'text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/20' : 'text-foreground'
                                    )}>
                                      {display === '—' ? (
                                        <span className="text-muted-foreground/40">—</span>
                                      ) : (
                                        <>
                                          {display}
                                          {isBest && <span className="ml-1 text-xs text-green-600">✓</span>}
                                        </>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}

            {/* Features comparison */}
            <Card>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Features & Extras</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <colgroup>
                      <col style={{ width: '200px' }} />
                      {cars.map(c => <col key={c.id} />)}
                    </colgroup>
                    <tbody>
                      <tr className="bg-muted/20">
                        <td className="py-2.5 px-4 text-xs text-muted-foreground font-medium border-r border-border/40">Total Features</td>
                        {cars.map(car => (
                          <td key={car.id} className="py-2.5 px-4 text-center text-sm font-semibold">
                            {featureCount(car)} features
                          </td>
                        ))}
                      </tr>
                      {/* Collect all unique features */}
                      {Array.from(new Set(cars.flatMap(c => Array.isArray(c.features) ? c.features as string[] : []))).sort().map((feat, fIdx) => (
                        <tr key={feat} className={fIdx % 2 === 0 ? '' : 'bg-muted/20'}>
                          <td className="py-2 px-4 text-xs text-muted-foreground border-r border-border/40">{feat}</td>
                          {cars.map(car => {
                            const has = Array.isArray(car.features) && (car.features as string[]).includes(feat);
                            return (
                              <td key={car.id} className="py-2 px-4 text-center">
                                {has
                                  ? <Check className="w-4 h-4 text-green-600 mx-auto" />
                                  : <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                                }
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Add another vehicle CTA */}
            {cars.length < 3 && (
              <div className="text-center py-6 border-2 border-dashed border-border rounded-xl hover:border-primary/30 transition-colors">
                <p className="text-sm text-muted-foreground mb-3">Add up to {3 - cars.length} more vehicle{3 - cars.length !== 1 ? 's' : ''} to compare</p>
                <Button variant="outline" asChild className="gap-2">
                  <Link to="/inventory"><Plus className="w-4 h-4" /> Add Another Vehicle</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
