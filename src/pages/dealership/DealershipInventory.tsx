import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Edit, Trash2, Search, Sparkles, Loader2, Eye, X, Image as ImageIcon, Building2, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OtherInput } from '@/components/ui/other-input';
import { DealershipLayout } from '@/components/layouts/DealershipLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import {
  formatCurrency, formatMileage, BODY_TYPES, FUEL_TYPES, TRANSMISSION_TYPES,
  CONDITIONS, PAKISTANI_CITIES, YEARS, COLORS, CAR_FEATURES, ENGINE_CAPACITIES,
  REG_YEARS, ASSEMBLY_TYPES, formatPKRWords
} from '@/lib/utils-xyz';
import { useWebPConverter } from '@/hooks/useWebPConverter';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Car, CarBrand, CarModel, CarVariant } from '@/types/types';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const EMPTY_FORM = {
  title: '',
  brand_id: '',
  model_id: '',
  variant_id: '',
  model_name: '',
  variant_name: '',
  year: new Date().getFullYear(),
  reg_year: new Date().getFullYear(),
  reg_year_str: String(new Date().getFullYear()),
  price: '',
  mileage: '',
  body_type: '',
  fuel_type: '',
  transmission: '',
  condition: 'used',
  color: '',
  engine_capacity: '',
  city: '',
  registration_city: '',
  assembly: 'Local',
  doors: '4',
  description: '',
  features: [] as string[],
  chassis_number: '',
  status: 'pending_approval',
  // "Other" free-text overrides
  brand_other: '',
  model_other: '',
  variant_other: '',
  color_other: '',
};

type ListingForm = typeof EMPTY_FORM;

function PriceDisplay({ value, label }: { value: string | number; label: string }) {
  const num = parseFloat(String(value).replace(/,/g, ''));
  const words = !isNaN(num) && num > 0 ? formatPKRWords(num) : '';
  if (!words) return null;
  return (
    <p className="text-xs text-primary font-medium mt-1">{label}: PKR {words}</p>
  );
}

export default function DealershipInventory() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { getSetting } = useSiteSettings();
  const { convertAll, converting } = useWebPConverter({ quality: 0.85, maxWidth: 1600 });
  const [cars, setCars] = useState<Car[]>([]);
  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [variants, setVariants] = useState<CarVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editCar, setEditCar] = useState<Car | null>(null);
  const [form, setForm] = useState<ListingForm>(EMPTY_FORM);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [dealershipId, setDealershipId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      supabase.from('dealership_members').select('dealership_id').eq('user_id', user.id).eq('is_active', true).maybeSingle()
        .then(({ data }) => { if (data) setDealershipId(data.dealership_id); });
      supabase.from('car_brands').select('*').order('name').then(({ data }) => {
        if (data) setBrands(data as CarBrand[]);
      });
    }
  }, [user]);

  const fetchCars = useCallback(async () => {
    if (!dealershipId) return;
    setLoading(true);
    const { data } = await supabase
      .from('cars')
      .select('*, car_brands(name)')
      .eq('dealership_id', dealershipId)
      .order('created_at', { ascending: false });
    if (data) setCars(data as Car[]);
    setLoading(false);
  }, [dealershipId]);

  useEffect(() => { fetchCars(); }, [fetchCars]);

  // Load models when brand changes
  useEffect(() => {
    if (form.brand_id) {
      supabase.from('car_models').select('*').eq('brand_id', form.brand_id).order('name')
        .then(({ data }) => { setModels(data as CarModel[] || []); setVariants([]); });
    } else {
      setModels([]); setVariants([]);
    }
  }, [form.brand_id]);

  // Load variants when model changes
  useEffect(() => {
    if (form.model_id) {
      supabase.from('car_variants').select('*').eq('model_id', form.model_id).order('name')
        .then(({ data }) => { setVariants(data as CarVariant[] || []); });
    } else {
      setVariants([]);
    }
  }, [form.model_id]);

  const openAdd = () => {
    setEditCar(null);
    setForm(EMPTY_FORM);
    setImageFiles([]); setImagePreviews([]); setExistingImages([]);
    setModels([]); setVariants([]);
    setDialogOpen(true);
  };

  const openEdit = (car: Car) => {
    setEditCar(car);
    setForm({
      title: car.title || '',
      brand_id: car.brand_id || '',
      model_id: car.model_id || '',
      variant_id: car.variant_id || '',
      model_name: car.model_name || '',
      variant_name: car.variant_name || '',
      year: car.year || new Date().getFullYear(),
      reg_year: (car as any).reg_year || car.year || new Date().getFullYear(),
      price: String(car.price || ''),
      mileage: String(car.mileage || ''),
      body_type: car.body_type || '',
      fuel_type: car.fuel_type || '',
      transmission: car.transmission || '',
      condition: car.condition || 'used',
      color: car.color || '',
      engine_capacity: car.engine_capacity || '',
      city: car.city || '',
      registration_city: (car as any).registration_city || car.city || '',
      assembly: (car as any).assembly || 'Local',
      doors: String((car as any).doors || '4'),
      description: car.description || '',
      features: car.features || [],
      chassis_number: (car as any).chassis_number || '',
      status: car.status || 'pending_approval',
      reg_year_str: car.registration_year != null ? String(car.registration_year) : String((car as any).reg_year || car.year || new Date().getFullYear()),
      brand_other: '',
      model_other: '',
      variant_other: '',
      color_other: '',
    });
    setExistingImages(car.images || []);
    setImageFiles([]); setImagePreviews([]);
    setDialogOpen(true);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 10 - existingImages.length - imageFiles.length;
    const toAdd = files.slice(0, remaining);

    // Convert all to WebP
    let converted: File[];
    try {
      converted = await convertAll(toAdd);
      toast.success(`${converted.length} image(s) converted to WebP`);
    } catch {
      converted = toAdd;
    }

    const previews = converted.map(f => URL.createObjectURL(f));
    setImageFiles(prev => [...prev, ...converted]);
    setImagePreviews(prev => [...prev, ...previews]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeNewImage = (idx: number) => {
    URL.revokeObjectURL(imagePreviews[idx]);
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const removeExistingImage = (idx: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFeatureToggle = (feature: string) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleBrandChange = (brandId: string) => {
    if (brandId === '__other__') {
      setForm(prev => ({ ...prev, brand_id: '__other__', brand_other: '', model_id: '', model_other: '', variant_id: '', variant_other: '', model_name: '', variant_name: '' }));
      return;
    }
    const brand = brands.find(b => b.id === brandId);
    setForm(prev => ({ ...prev, brand_id: brandId, brand_other: '', model_id: '', variant_id: '', model_name: brand?.name || '', variant_name: '' }));
  };

  const handleModelChange = (modelId: string) => {
    if (modelId === '__other__') {
      setForm(prev => ({ ...prev, model_id: '__other__', model_other: '', variant_id: '', variant_other: '', variant_name: '' }));
      return;
    }
    const model = models.find(m => m.id === modelId);
    setForm(prev => ({ ...prev, model_id: modelId, model_other: '', variant_id: '', model_name: model?.name || prev.model_name, variant_name: '' }));
  };

  const handleVariantChange = (variantId: string) => {
    if (variantId === '__other__') {
      setForm(prev => ({ ...prev, variant_id: '__other__', variant_other: '' }));
      return;
    }
    const variant = variants.find(v => v.id === variantId);
    setForm(prev => ({ ...prev, variant_id: variantId, variant_other: '', variant_name: variant?.name || '' }));
  };

  // Resolve effective display names (use _other when sentinel is selected)
  const effBrandName   = form.brand_id   === '__other__' ? form.brand_other   : (brands.find(b => b.id === form.brand_id)?.name   || '');
  const effModelName   = form.model_id   === '__other__' ? form.model_other   : (models.find(m => m.id === form.model_id)?.name   || form.model_name);
  const effVariantName = form.variant_id === '__other__' ? form.variant_other : (variants.find(v => v.id === form.variant_id)?.name || form.variant_name);
  const effColor       = form.color      === 'Other'     ? form.color_other   : form.color;

  const autoTitle = () => {
    const parts = [form.year, effBrandName, effModelName, effVariantName].filter(Boolean);
    if (parts.length >= 2) setForm(prev => ({ ...prev, title: parts.join(' ') }));
  };

  const generateDescription = async () => {
    if (!form.brand_id) { toast.error('Select brand first'); return; }
    setGeneratingDesc(true);
    await new Promise(r => setTimeout(r, 800));
    const desc = `${form.year} ${effBrandName} ${effModelName} ${effVariantName} in ${effColor || 'excellent'} color with ${form.mileage ? formatMileage(parseInt(form.mileage)) : 'low mileage'}. ${form.transmission} transmission, ${form.fuel_type} engine. Well-maintained vehicle located in ${form.city || 'Pakistan'}. ${form.condition === 'new' ? 'Brand new, zero meter.' : 'Single owner, all genuine.'} Contact for test drive.`.trim();
    setForm(prev => ({ ...prev, description: desc }));
    setGeneratingDesc(false);
    toast.success('Description generated');
  };

  const uploadImages = async (): Promise<string[]> => {
    if (!imageFiles.length) return [];
    const urls: string[] = [];
    for (const file of imageFiles) {
      const path = `cars/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
      const { error } = await supabase.storage.from('car-images').upload(path, file, { contentType: 'image/webp' });
      if (!error) {
        const { data } = supabase.storage.from('car-images').getPublicUrl(path);
        if (data?.publicUrl) urls.push(data.publicUrl);
      }
    }
    return urls;
  };

  const handleSave = async () => {
    if (!form.brand_id) { toast.error('Please select a brand'); return; }
    if (!form.price) { toast.error('Please enter price'); return; }
    if (!dealershipId) { toast.error('No dealership linked to account'); return; }
    setSaving(true);
    try {
      const newImageUrls = await uploadImages();
      const allImages = [...existingImages, ...newImageUrls];

      const regYearNum = form.reg_year_str && form.reg_year_str !== 'Unregistered' ? parseInt(form.reg_year_str) : null;

      const payload = {
        title: form.title || `${form.year} ${effBrandName} ${effModelName}`.trim(),
        brand_id: form.brand_id !== '__other__' ? (form.brand_id || null) : null,
        model_id: form.model_id !== '__other__' ? (form.model_id || null) : null,
        variant_id: form.variant_id !== '__other__' ? (form.variant_id || null) : null,
        brand_name: effBrandName,
        model_name: effModelName,
        variant_name: effVariantName,
        year: Number(form.year),
        registration_year: regYearNum,
        price: parseFloat(form.price),
        mileage: form.mileage ? parseInt(form.mileage) : null,
        body_type: form.body_type,
        fuel_type: form.fuel_type,
        transmission: form.transmission,
        condition: form.condition,
        color: effColor,
        engine_capacity: form.engine_capacity,
        city: form.city,
        registration_city: form.registration_city,
        assembly: form.assembly,
        doors: form.doors ? parseInt(form.doors) : null,
        description: form.description,
        features: form.features,
        chassis_number: form.chassis_number || null,
        images: allImages,
        dealership_id: dealershipId,
        status: form.status,
      };

      if (editCar) {
        await supabase.from('cars').update(payload).eq('id', editCar.id);
        toast.success('Listing updated');
      } else {
        await supabase.from('cars').insert(payload);
        toast.success('Listing submitted for approval');
      }
      setDialogOpen(false);
      fetchCars();
    } catch (err) {
      toast.error('Error saving listing');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('cars').delete().eq('id', id);
    toast.success('Listing deleted');
    setDeleteId(null);
    fetchCars();
  };

  const filtered = cars.filter(c =>
    [c.title, c.brand_name, c.model_name].join(' ').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (s: string) => {
    const m: Record<string, string> = {
      active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      pending_approval: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      inactive: 'bg-muted text-muted-foreground',
      sold: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return m[s] || 'bg-muted text-muted-foreground';
  };

  return (
    <DealershipLayout>
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">My Inventory</h1>
            <p className="text-sm text-muted-foreground">{cars.length} listings</p>
          </div>
          <Button onClick={openAdd} size="sm" className="h-9">
            <Plus className="w-4 h-4 mr-1.5" />Add New Car
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search listings..." className="pl-9 h-9 text-sm" />
        </div>

        {/* Listings table */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3 whitespace-nowrap">Vehicle</th>
                  <th className="text-left px-4 py-3 whitespace-nowrap hidden md:table-cell">Price</th>
                  <th className="text-left px-4 py-3 whitespace-nowrap hidden lg:table-cell">Details</th>
                  <th className="text-left px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="text-right px-4 py-3 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={5} className="py-3 px-4"><Skeleton className="h-8 w-full" /></td>
                  </tr>
                )) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">
                    {search ? 'No results found' : 'No listings yet — click "Add New Car" to get started'}
                  </td></tr>
                ) : filtered.map(car => (
                  <tr key={car.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                          {car.images?.[0] && <img src={car.images[0]} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[180px]">{car.title || `${car.brand_name} ${car.model_name}`}</p>
                          <p className="text-xs text-muted-foreground">{car.year} · {car.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3">
                      <p className="text-sm font-semibold whitespace-nowrap">{formatCurrency(car.price)}</p>
                      <p className="text-xs text-muted-foreground">{formatPKRWords(car.price)}</p>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3">
                      <p className="text-xs text-muted-foreground whitespace-nowrap">{car.fuel_type} · {car.transmission}</p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">{car.mileage ? formatMileage(car.mileage) : '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn('text-xs whitespace-nowrap', getStatusColor(car.status))}>{car.status?.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="w-7 h-7" asChild>
                          <Link to={`/inventory/${car.id}`} target="_blank"><Eye className="w-3.5 h-3.5" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(car)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => setDeleteId(car.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={o => { if (!saving) setDialogOpen(o); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-3xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editCar ? 'Edit Listing' : 'Add New Car Listing'}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="specs">Specs</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
            </TabsList>

            {/* ── Basic Info Tab ─────────────────────────────────────── */}
            <TabsContent value="basic" className="space-y-4">
              {/* Brand / Model / Variant row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Brand <span className="text-destructive">*</span></Label>
                  <Select value={form.brand_id} onValueChange={handleBrandChange}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select brand" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      <SelectItem value="__other__">Other (specify)</SelectItem>
                    </SelectContent>
                  </Select>
                  <OtherInput trigger={form.brand_id === '__other__' ? 'Other' : form.brand_id} value={form.brand_other} onChange={v => setForm(p => ({ ...p, brand_other: v }))} placeholder="Enter brand name" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Model</Label>
                  <Select value={form.model_id} onValueChange={handleModelChange} disabled={!form.brand_id}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={form.brand_id ? "Select model" : "Select brand first"} /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {models.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                      <SelectItem value="__other__">Other (specify)</SelectItem>
                    </SelectContent>
                  </Select>
                  <OtherInput trigger={form.model_id === '__other__' ? 'Other' : form.model_id} value={form.model_other} onChange={v => setForm(p => ({ ...p, model_other: v }))} placeholder="Enter model name" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Variant</Label>
                  <Select value={form.variant_id} onValueChange={handleVariantChange} disabled={!form.model_id}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={form.model_id ? "Select variant" : "Select model first"} /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {variants.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                      <SelectItem value="__other__">Other (specify)</SelectItem>
                    </SelectContent>
                  </Select>
                  <OtherInput trigger={form.variant_id === '__other__' ? 'Other' : form.variant_id} value={form.variant_other} onChange={v => setForm(p => ({ ...p, variant_other: v }))} placeholder="Enter variant name" />
                </div>
              </div>

              {/* Listing title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">Listing Title</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={autoTitle} className="h-6 text-xs px-2 text-primary">
                    Auto-fill from selection
                  </Button>
                </div>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. 2023 Toyota Corolla Altis Grande" className="h-9 text-sm" />
              </div>

              {/* Year / Reg Year / Condition row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Model Year <span className="text-destructive">*</span></Label>
                  <Select value={String(form.year)} onValueChange={v => setForm(p => ({ ...p, year: parseInt(v) }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-52">
                      {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Registration Year</Label>
                  <Select value={form.reg_year_str} onValueChange={v => setForm(p => ({ ...p, reg_year_str: v, reg_year: v !== 'Unregistered' ? parseInt(v) : p.reg_year }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-52">
                      <SelectItem value="Unregistered">Unregistered</SelectItem>
                      {REG_YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Condition</Label>
                  <Select value={form.condition} onValueChange={v => setForm(p => ({ ...p, condition: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map(c => <SelectItem key={c} value={c.toLowerCase().replace(/\s+/g, '-')}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price / Mileage row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Price (PKR) <span className="text-destructive">*</span></Label>
                  <Input value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value.replace(/[^0-9.]/g, '') }))}
                    placeholder="e.g. 3500000" className="h-9 text-sm" type="text" inputMode="numeric" />
                  <PriceDisplay value={form.price} label="Price" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Mileage (km)</Label>
                  <Input value={form.mileage} onChange={e => setForm(p => ({ ...p, mileage: e.target.value.replace(/[^0-9]/g, '') }))}
                    placeholder="e.g. 45000" className="h-9 text-sm" type="text" inputMode="numeric" />
                  {form.mileage && parseInt(form.mileage) > 0 && (
                    <p className="text-xs text-muted-foreground">{parseInt(form.mileage).toLocaleString()} km</p>
                  )}
                </div>
              </div>

              {/* City / Registration City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">City</Label>
                  <Select value={form.city} onValueChange={v => setForm(p => ({ ...p, city: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent>
                      {PAKISTANI_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Registration City</Label>
                  <Select value={form.registration_city} onValueChange={v => setForm(p => ({ ...p, registration_city: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select reg city" /></SelectTrigger>
                    <SelectContent>
                      {PAKISTANI_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">Description</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={generateDescription} disabled={generatingDesc}
                    className="h-6 text-xs px-2 text-primary">
                    {generatingDesc ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    AI Generate
                  </Button>
                </div>
                <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe the vehicle..." className="min-h-[80px] text-sm resize-none" />
              </div>
            </TabsContent>

            {/* ── Specs Tab ─────────────────────────────────────────── */}
            <TabsContent value="specs" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Fuel Type</Label>
                  <Select value={form.fuel_type} onValueChange={v => setForm(p => ({ ...p, fuel_type: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select fuel type" /></SelectTrigger>
                    <SelectContent>{FUEL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Transmission</Label>
                  <Select value={form.transmission} onValueChange={v => setForm(p => ({ ...p, transmission: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select transmission" /></SelectTrigger>
                    <SelectContent>{TRANSMISSION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Body Type</Label>
                  <Select value={form.body_type} onValueChange={v => setForm(p => ({ ...p, body_type: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select body type" /></SelectTrigger>
                    <SelectContent>{BODY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Color</Label>
                  <Select value={form.color} onValueChange={v => setForm(p => ({ ...p, color: v, color_other: '' }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select color" /></SelectTrigger>
                    <SelectContent>{COLORS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <OtherInput trigger={form.color} value={form.color_other} onChange={v => setForm(p => ({ ...p, color_other: v }))} placeholder="Enter color" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Engine Capacity</Label>
                  <Select value={form.engine_capacity} onValueChange={v => setForm(p => ({ ...p, engine_capacity: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select engine" /></SelectTrigger>
                    <SelectContent>{ENGINE_CAPACITIES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Assembly</Label>
                  <Select value={form.assembly} onValueChange={v => setForm(p => ({ ...p, assembly: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{ASSEMBLY_TYPES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Doors</Label>
                  <Select value={form.doors} onValueChange={v => setForm(p => ({ ...p, doors: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['2','3','4','5','6'].map(d => <SelectItem key={d} value={d}>{d} Doors</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Chassis Number <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input value={form.chassis_number} onChange={e => setForm(p => ({ ...p, chassis_number: e.target.value }))}
                    placeholder="Optional chassis/VIN" className="h-9 text-sm" />
                </div>
              </div>
            </TabsContent>

            {/* ── Features Tab ──────────────────────────────────────── */}
            <TabsContent value="features" className="space-y-3">
              <p className="text-sm text-muted-foreground">Select all features available in this vehicle</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {CAR_FEATURES.map(feat => (
                  <div key={feat} className={cn(
                    'flex items-center gap-2 p-2.5 rounded-lg border border-border cursor-pointer transition-colors text-sm',
                    form.features.includes(feat) ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/40'
                  )} onClick={() => handleFeatureToggle(feat)}>
                    <Checkbox checked={form.features.includes(feat)} onCheckedChange={() => handleFeatureToggle(feat)} className="shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* ── Images Tab ────────────────────────────────────────── */}
            <TabsContent value="images" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Vehicle Photos</p>
                  <p className="text-xs text-muted-foreground">{existingImages.length + imageFiles.length}/10 · Images auto-converted to WebP</p>
                </div>
                <Button type="button" variant="outline" size="sm" className="h-8"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={existingImages.length + imageFiles.length >= 10}>
                  <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
                  {converting ? 'Converting...' : 'Add Photos'}
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
              </div>

              {existingImages.length + imagePreviews.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to add vehicle photos</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP · Auto-converted to WebP · Max 10 images</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {existingImages.map((url, i) => (
                    <div key={`ex-${i}`} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeExistingImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                      {i === 0 && <Badge className="absolute bottom-1 left-1 text-[10px] py-0 px-1">Main</Badge>}
                    </div>
                  ))}
                  {imagePreviews.map((url, i) => (
                    <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeNewImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                      <Badge className="absolute top-1 left-1 text-[10px] py-0 px-1 bg-primary text-primary-foreground">WebP</Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Brand contact info — read-only for dealership users */}
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              Listing contact info (set by admin)
            </div>
            <p className="text-sm font-semibold">{getSetting('site_name', 'XYZ Automobiles')}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {getSetting('contact_phone', '') && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="w-3 h-3 shrink-0" />
                  {getSetting('contact_phone', '')}
                </span>
              )}
              {getSetting('contact_email', '') && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="w-3 h-3 shrink-0" />
                  {getSetting('contact_email', '')}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Contact details sync automatically from site settings. Only an admin can change them.</p>
          </div>

          <Separator />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || converting}>
              {saving ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saving...</> : editCar ? 'Update Listing' : 'Submit Listing'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>This listing will be permanently deleted. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DealershipLayout>
  );
}
