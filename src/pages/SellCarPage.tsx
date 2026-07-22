import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Car, Camera, CheckCircle, ArrowLeft, ArrowRight,
  Upload, X, Sparkles, Loader2, Info, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { OtherInput } from '@/components/ui/other-input';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useCarDatabase } from '@/hooks/useCarDatabase';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Vehicle Info',    icon: Car },
  { id: 2, label: 'Specs',           icon: Info },
  { id: 3, label: 'Photos & Desc',   icon: Camera },
  { id: 4, label: 'Location',        icon: MapPin },
  { id: 5, label: 'Review',          icon: CheckCircle },
];

const FUEL_TYPES    = ['Petrol', 'Diesel', 'Hybrid', 'CNG', 'LPG', 'Electric'];
const TRANSMISSIONS = ['Automatic', 'Manual', 'CVT', 'Semi-Automatic'];
const BODY_TYPES    = ['Sedan', 'Hatchback', 'SUV', 'Crossover', 'Pickup', 'Van', 'Coupe', 'Minivan', 'Wagon', 'MPV'];
const CONDITIONS    = ['New', 'Used', 'Certified Pre-Owned'];
const CITIES        = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Hyderabad', 'Gujranwala', 'Abbottabad', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana'];
const ASSEMBLIES    = ['Local', 'Imported'];
const COLORS        = ['White', 'Pearl White', 'Silver', 'Gray', 'Charcoal', 'Black', 'Red', 'Maroon', 'Blue', 'Dark Blue', 'Navy Blue', 'Green', 'Olive Green', 'Beige', 'Champagne', 'Gold', 'Brown', 'Orange', 'Yellow', 'Other'];
const DRIVE_TYPES   = ['FWD', 'RWD', 'AWD', '4WD'];
const FEATURES_LIST = ['ABS', 'Airbags', 'Navigation', 'Reverse Camera', 'Sunroof', 'Heated Seats', 'Leather Seats', 'Cruise Control', 'Keyless Entry', 'Push Start', 'Android Auto', 'Apple CarPlay', 'Bluetooth', 'USB Charging', 'Alloy Wheels', 'Fog Lights', 'Rear Spoiler', 'Climate Control'];

type FormData = {
  brand_name: string; model_name: string; variant_name: string; year: string;
  condition: string; assembly: string; body_type: string; color: string;
  fuel_type: string; transmission: string; engine_size: string; mileage: string;
  cylinders: string; drive_type: string; doors: string; seating_capacity: string;
  price: string; is_negotiable: boolean;
  description: string; features: string[];
  city: string; registration_city: string; registration_year: string; registration_number: string;
  seller_name: string; seller_phone: string;
  // "Other" free-text overrides
  brand_other: string; model_other: string; variant_other: string; color_other: string;
};

const EMPTY: FormData = {
  brand_name: '', model_name: '', variant_name: '', year: '', condition: '', assembly: '',
  body_type: '', color: '', fuel_type: '', transmission: '', engine_size: '', mileage: '',
  cylinders: '', drive_type: '', doors: '', seating_capacity: '', price: '', is_negotiable: false,
  description: '', features: [],
  city: '', registration_city: '', registration_year: '', registration_number: '',
  seller_name: '', seller_phone: '',
  brand_other: '', model_other: '', variant_other: '', color_other: '',
};

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-between gap-0 mb-8 overflow-x-auto pb-2">
      {STEPS.map((s, idx) => (
        <div key={s.id} className="flex items-center flex-1 min-w-0">
          <div className="flex flex-col items-center shrink-0">
            <div className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all',
              s.id < current ? 'bg-primary border-primary text-primary-foreground' :
              s.id === current ? 'border-primary text-primary bg-primary/10' :
              'border-border text-muted-foreground bg-background'
            )}>
              {s.id < current ? <CheckCircle className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
            </div>
            <span className={cn('text-[10px] mt-1 font-medium whitespace-nowrap', s.id === current ? 'text-primary' : 'text-muted-foreground')}>{s.label}</span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={cn('flex-1 h-0.5 mx-2 mt-[-14px]', s.id < current ? 'bg-primary' : 'bg-border')} />
          )}
        </div>
      ))}
    </div>
  );
}


export default function SellCarPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { brands: dbBrands, loading: dbLoading, modelsForBrand, variantsForModel } = useCarDatabase();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Derive models/variants from selected brand/model using DB hook
  const selectedBrand = form.brand_name !== 'Other' ? dbBrands.find(b => b.name === form.brand_name) : null;
  const dbModels = selectedBrand ? modelsForBrand(selectedBrand.id) : [];
  const selectedModel = form.model_name !== 'Other' ? dbModels.find(m => m.name === form.model_name) : null;
  const dbVariants = selectedModel ? variantsForModel(selectedModel.id) : [];

  const set = (k: keyof FormData, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const setBrand = (v: string) => setForm(f => ({ ...f, brand_name: v, brand_other: '', model_name: '', model_other: '', variant_name: '', variant_other: '' }));
  const setModel = (v: string) => setForm(f => ({ ...f, model_name: v, model_other: '', variant_name: '', variant_other: '' }));

  // Resolve final string values (use _other if "Other" was chosen)
  const effectiveBrand   = form.brand_name   === 'Other' ? form.brand_other   : form.brand_name;
  const effectiveModel   = form.model_name   === 'Other' ? form.model_other   : form.model_name;
  const effectiveVariant = form.variant_name === 'Other' ? form.variant_other : form.variant_name;
  const effectiveColor   = form.color        === 'Other' ? form.color_other   : form.color;
  const effectiveRegYear = form.registration_year;

  const toggleFeature = (feat: string) => {
    setForm(f => ({ ...f, features: f.features.includes(feat) ? f.features.filter(x => x !== feat) : [...f.features, feat] }));
  };

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => f.size <= 2 * 1024 * 1024);
    if (valid.length < files.length) toast.error('Some files exceeded 2MB and were removed');
    const all = [...images, ...valid].slice(0, 10);
    setImages(all);
    Promise.all(all.map(f => new Promise<string>(res => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(f); }))).then(setPreviews);
  };

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
    setPreviews(previews.filter((_, i) => i !== idx));
  };

  const generateDesc = () => {
    setGeneratingDesc(true);
    setTimeout(() => {
      const desc = `${form.year} ${effectiveBrand} ${effectiveModel}${effectiveVariant ? ' ' + effectiveVariant : ''} in excellent condition. This ${form.condition?.toLowerCase() || ''} vehicle features a ${form.engine_size || ''} ${form.fuel_type?.toLowerCase() || ''} engine with ${form.transmission?.toLowerCase() || ''} transmission. ${form.mileage ? `Odometer reads ${Number(form.mileage).toLocaleString('en-US')} km.` : ''} ${form.features.length ? `Equipped with ${form.features.slice(0, 4).join(', ')} and more.` : ''} Well maintained, no major accidents. Priced at PKR ${Number(form.price || 0).toLocaleString('en-US')}${form.is_negotiable ? ', price is negotiable' : ''}.`;
      set('description', desc.replace(/\s+/g, ' ').trim());
      setGeneratingDesc(false);
    }, 1200);
  };

  const canNext = () => {
    if (step === 1) return !!(effectiveBrand && effectiveModel && form.year && form.condition && form.assembly && form.price && form.registration_year);
    if (step === 2) return !!(form.fuel_type && form.transmission && form.body_type);
    if (step === 3) return !!(form.description && previews.length >= 1);
    if (step === 4) return !!(form.city && form.seller_phone);
    return true;
  };

  const handleSubmit = async () => {
    if (!user) { toast.error('Please log in to submit a listing'); return; }
    setSubmitting(true); setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of images) {
        const fileName = `${user.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const { error } = await supabase.storage.from('car-images').upload(fileName, file, { contentType: file.type });
        if (!error) { const { data: u } = supabase.storage.from('car-images').getPublicUrl(fileName); uploadedUrls.push(u.publicUrl); }
      }
      setUploading(false);
      const payload = {
        seller_id: user.id,
        brand_name: effectiveBrand, model_name: effectiveModel, variant_name: effectiveVariant || null,
        year: parseInt(form.year), condition: form.condition, assembly: form.assembly,
        body_type: form.body_type || null, color: effectiveColor || null,
        fuel_type: form.fuel_type || null, transmission: form.transmission || null,
        engine_size: form.engine_size || null, mileage: form.mileage ? parseInt(form.mileage) : null,
        cylinders: form.cylinders ? parseInt(form.cylinders) : null, drive_type: form.drive_type || null,
        doors: form.doors ? parseInt(form.doors) : null, seating_capacity: form.seating_capacity ? parseInt(form.seating_capacity) : null,
        price: parseInt(form.price), is_negotiable: form.is_negotiable,
        description: form.description, features: form.features,
        city: form.city, registration_city: form.registration_city || form.city,
        registration_year: effectiveRegYear && effectiveRegYear !== 'Unregistered' ? parseInt(effectiveRegYear) : null,
        registration_number: form.registration_number || null,
        images: uploadedUrls, status: 'pending',
        title: `${form.year} ${effectiveBrand} ${effectiveModel}${effectiveVariant ? ' ' + effectiveVariant : ''}`,
      };
      const { error } = await supabase.from('cars').insert(payload);
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error('Submission error:', err);
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message;
      toast.error(msg ? `Submission failed: ${msg}` : 'Failed to submit listing. Please try again.');
    } finally {
      setSubmitting(false); setUploading(false);
    }
  };

  if (submitted) {
    return (
      <PublicLayout>
        <div className="section-bg-dark-premium pt-[68px]">
          <div className="max-w-lg mx-auto px-4 md:px-6 py-24 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-primary-foreground mb-3">Listing Submitted!</h1>
            <p className="text-primary-foreground/60 text-sm mb-8 leading-relaxed">
              Your listing is pending review. Our team will approve it within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="bg-white text-gray-900 hover:bg-white/90 font-medium">
                <Link to="/dashboard">View My Listings</Link>
              </Button>
              <Button variant="ghost" onClick={() => { setSubmitted(false); setForm(EMPTY); setImages([]); setPreviews([]); setStep(1); }}
                className="border border-white/20 text-white hover:bg-white/10">
                List Another Car
              </Button>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="section-bg-dark-premium border-b border-border/20 pt-[68px]">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-10">
          <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">Sell Your Car</h1>
          <p className="text-sm text-primary-foreground/60 mt-1.5">Pakistan's #1 automotive marketplace — free &amp; easy</p>
          <Progress value={(step / STEPS.length) * 100} className="mt-4 h-1.5 bg-white/10" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8">
        <StepIndicator current={step} total={STEPS.length} />

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-foreground pb-2 border-b border-border">Vehicle Identity</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Brand <span className="text-destructive">*</span></Label>
                <Select value={form.brand_name} onValueChange={setBrand} disabled={dbLoading}>
                  <SelectTrigger className="h-10">
                    {dbLoading ? <span className="text-muted-foreground text-sm flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading…</span> : <SelectValue placeholder="Select brand" />}
                  </SelectTrigger>
                  <SelectContent>
                    {dbBrands.length === 0 && !dbLoading && <SelectItem value="_none" disabled>No brands available</SelectItem>}
                    {dbBrands.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                    <SelectItem value="Other">Other (specify)</SelectItem>
                  </SelectContent>
                </Select>
                <OtherInput trigger={form.brand_name} value={form.brand_other} onChange={v => set('brand_other', v)} placeholder="Enter brand name" height="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Model <span className="text-destructive">*</span></Label>
                <Select value={form.model_name} onValueChange={setModel} disabled={!form.brand_name}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={form.brand_name ? 'Select model' : 'Pick brand first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {dbModels.length === 0 && form.brand_name && form.brand_name !== 'Other' && <SelectItem value="_none" disabled>No models for this brand</SelectItem>}
                    {dbModels.map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                    <SelectItem value="Other">Other (specify)</SelectItem>
                  </SelectContent>
                </Select>
                <OtherInput trigger={form.model_name} value={form.model_other} onChange={v => set('model_other', v)} placeholder="Enter model name" height="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Variant / Trim</Label>
                <Select value={form.variant_name} onValueChange={v => set('variant_name', v)} disabled={!form.model_name}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={!form.model_name ? 'Pick model first' : dbVariants.length ? 'Select variant' : 'No variants listed'} />
                  </SelectTrigger>
                  <SelectContent>
                    {dbVariants.map(v => <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>)}
                    <SelectItem value="Other">Other (specify)</SelectItem>
                  </SelectContent>
                </Select>
                <OtherInput trigger={form.variant_name} value={form.variant_other} onChange={v => set('variant_other', v)} placeholder="Enter variant name" height="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Year <span className="text-destructive">*</span></Label>
                <Select value={form.year} onValueChange={v => set('year', v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>{Array.from({ length: 31 }, (_, i) => 2026 - i).map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Condition <span className="text-destructive">*</span></Label>
                <Select value={form.condition} onValueChange={v => set('condition', v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Condition" /></SelectTrigger>
                  <SelectContent>{CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Assembly <span className="text-destructive">*</span></Label>
                <Select value={form.assembly} onValueChange={v => set('assembly', v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Assembly" /></SelectTrigger>
                  <SelectContent>{ASSEMBLIES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('color')}</Label>
                <Select value={form.color} onValueChange={v => set('color', v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select color" /></SelectTrigger>
                  <SelectContent>{COLORS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <OtherInput trigger={form.color} value={form.color_other} onChange={v => set('color_other', v)} placeholder="Enter color" height="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Registration Year <span className="text-destructive">*</span></Label>
                <Select value={form.registration_year} onValueChange={v => set('registration_year', v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Reg. Year" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unregistered">Unregistered</SelectItem>
                    {Array.from({ length: 31 }, (_, i) => 2026 - i).map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Registration Number</Label>
                <Input
                  value={form.registration_number}
                  onChange={e => set('registration_number', e.target.value.toUpperCase())}
                  placeholder="e.g. ABC-123"
                  className="h-10 font-mono tracking-wide"
                  maxLength={15}
                />
              </div>
            </div>
            <Separator />
            <h2 className="text-sm font-semibold text-foreground pb-2 border-b border-border">Pricing</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label>Asking Price (PKR) <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">PKR</span>
                  <Input value={form.price} onChange={e => set('price', e.target.value.replace(/\D/g, ''))} placeholder="4,500,000" className="pl-12 h-10" />
                </div>
                {form.price && <p className="text-xs text-muted-foreground">{Number(form.price).toLocaleString('en-US')} PKR</p>}
              </div>
              <div className="flex items-center gap-2 self-end pb-1">
                <Checkbox id="negotiable" checked={form.is_negotiable} onCheckedChange={v => set('is_negotiable', !!v)} />
                <Label htmlFor="negotiable" className="cursor-pointer text-sm">Price is negotiable</Label>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-foreground pb-2 border-b border-border">Technical Specs</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Fuel Type <span className="text-destructive">*</span></Label>
                <Select value={form.fuel_type} onValueChange={v => set('fuel_type', v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select fuel" /></SelectTrigger>
                  <SelectContent>{FUEL_TYPES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Transmission <span className="text-destructive">*</span></Label>
                <Select value={form.transmission} onValueChange={v => set('transmission', v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Transmission" /></SelectTrigger>
                  <SelectContent>{TRANSMISSIONS.map(tx => <SelectItem key={tx} value={tx}>{tx}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Body Type <span className="text-destructive">*</span></Label>
                <Select value={form.body_type} onValueChange={v => set('body_type', v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Body type" /></SelectTrigger>
                  <SelectContent>{BODY_TYPES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Mileage (km)</Label>
                <Input value={form.mileage} onChange={e => set('mileage', e.target.value.replace(/\D/g, ''))} placeholder="e.g. 45000" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Engine Size</Label>
                <Input value={form.engine_size} onChange={e => set('engine_size', e.target.value)} placeholder="e.g. 1.8L" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Cylinders</Label>
                <Select value={form.cylinders} onValueChange={v => set('cylinders', v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Cylinders" /></SelectTrigger>
                  <SelectContent>{['3','4','6','8','12'].map(n => <SelectItem key={n} value={n}>{n} cylinders</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Drive Type</Label>
                <Select value={form.drive_type} onValueChange={v => set('drive_type', v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Drive type" /></SelectTrigger>
                  <SelectContent>{DRIVE_TYPES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Doors</Label>
                <Select value={form.doors} onValueChange={v => set('doors', v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Doors" /></SelectTrigger>
                  <SelectContent>{['2','3','4','5'].map(d => <SelectItem key={d} value={d}>{d} doors</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Seating Capacity</Label>
                <Select value={form.seating_capacity} onValueChange={v => set('seating_capacity', v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Seats" /></SelectTrigger>
                  <SelectContent>{['2','4','5','6','7','8','9'].map(s => <SelectItem key={s} value={s}>{s} seats</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <h2 className="text-sm font-semibold text-foreground pb-2 border-b border-border">Features &amp; Extras</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {FEATURES_LIST.map(feat => (
                <label key={feat} className="flex items-center gap-2 cursor-pointer min-h-9 hover:bg-muted/30 rounded-lg px-2 py-1 transition-colors">
                  <Checkbox checked={form.features.includes(feat)} onCheckedChange={() => toggleFeature(feat)} />
                  <span className="text-sm">{feat}</span>
                </label>
              ))}
            </div>
            {form.features.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.features.map(f => (
                  <Badge key={f} variant="secondary" className="gap-1 text-xs">{f}
                    <button onClick={() => toggleFeature(f)} className="ml-0.5 hover:text-destructive"><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-foreground pb-2 border-b border-border">Photos <span className="text-destructive">*</span></h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                  {i === 0 && <Badge className="absolute bottom-1 left-1 text-[9px] h-4 px-1.5 bg-primary/80">Main</Badge>}
                </div>
              ))}
              {previews.length < 10 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground text-center px-1">Add Photo</span>
                  <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Max 10 photos · JPG, PNG · Max 2MB each · First photo is main photo</p>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Description <span className="text-destructive">*</span></Label>
                <Button type="button" variant="outline" size="sm" onClick={generateDesc}
                  disabled={generatingDesc || !form.brand_name || !form.model_name || !form.year} className="gap-1.5 h-7 text-xs">
                  {generatingDesc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} AI Generate
                </Button>
              </div>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Describe your vehicle — condition, history, reason for selling, any notable features or upgrades…"
                className="min-h-[140px] resize-none" />
              <p className="text-xs text-muted-foreground">{form.description.length} / 2000 characters</p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-foreground pb-2 border-b border-border">Location</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>City <span className="text-destructive">*</span></Label>
                <Select value={form.city} onValueChange={v => set('city', v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select city" /></SelectTrigger>
                  <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Registration City</Label>
                <Select value={form.registration_city} onValueChange={v => set('registration_city', v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Reg. city" /></SelectTrigger>
                  <SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <h2 className="text-sm font-semibold text-foreground pb-2 border-b border-border">Contact Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Your Name</Label>
                <Input value={form.seller_name} onChange={e => set('seller_name', e.target.value)} placeholder="Full name" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone Number <span className="text-destructive">*</span></Label>
                <Input value={form.seller_phone} onChange={e => set('seller_phone', e.target.value)} placeholder="+92 300 0000000" className="h-10" />
              </div>
            </div>
            <Card className="bg-muted/30 border-border/60">
              <CardContent className="p-4 flex gap-3">
                <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">Your phone number will be shown to interested buyers. Listings are reviewed within 24 hours.</p>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-foreground pb-2 border-b border-border">Review Your Listing</h2>
            <Card>
              <CardContent className="p-5 space-y-4">
                {previews.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {previews.slice(0, 5).map((src, i) => <img key={i} src={src} alt="" className="w-24 h-16 object-cover rounded-md shrink-0" />)}
                    {previews.length > 5 && <div className="w-24 h-16 bg-muted rounded-md shrink-0 flex items-center justify-center text-xs text-muted-foreground">+{previews.length - 5} more</div>}
                  </div>
                )}
                <div>
                  <p className="text-xl font-bold">{form.year} {effectiveBrand} {effectiveModel} {effectiveVariant}</p>
                  <p className="text-2xl font-black text-primary">PKR {Number(form.price || 0).toLocaleString('en-US')}{form.is_negotiable ? ' (Negotiable)' : ''}</p>
                </div>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  {[
                    ['Condition', form.condition], ['Assembly', form.assembly],
                    ['Body Type', form.body_type], ['Color', effectiveColor],
                    ['Fuel Type', form.fuel_type], ['Transmission', form.transmission],
                    ['Engine', form.engine_size], ['Mileage', form.mileage ? `${Number(form.mileage).toLocaleString('en-US')} km` : ''],
                    ['Reg. Year', form.registration_year], ['Reg. No.', form.registration_number], ['City', form.city],
                    ['Phone', form.seller_phone],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <div key={k}><span className="text-muted-foreground text-xs">{k}: </span><span className="font-medium">{v}</span></div>
                  ))}
                </div>
                {form.features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">{form.features.map(f => <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>)}</div>
                )}
                {form.description && <p className="text-sm text-muted-foreground leading-relaxed">{form.description}</p>}
              </CardContent>
            </Card>
            {!user && (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-4 flex gap-3">
                  <Info className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">You need to <Link to="/login" className="underline font-medium">log in</Link> before submitting.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
          ) : (
            <Button variant="ghost" asChild className="gap-2 text-muted-foreground">
              <Link to="/inventory"><ArrowLeft className="w-4 h-4" /> Cancel</Link>
            </Button>
          )}
          {step < STEPS.length ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="gap-2">Next <ArrowRight className="w-4 h-4" /></Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting || !user} className="gap-2 h-11 px-6">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />{uploading ? 'Uploading photos…' : 'Submitting…'}</> : <><CheckCircle className="w-4 h-4" /> Submit Listing</>}
            </Button>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
