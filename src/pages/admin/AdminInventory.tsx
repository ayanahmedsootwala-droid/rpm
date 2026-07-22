import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Eye, Trash2, Check, X, ChevronLeft, ChevronRight,
  Phone, Building2, Plus, ImagePlus, Sparkles, Loader2, Pencil,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { OtherInput } from '@/components/ui/other-input';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import CarBrandModelSelect from '@/components/cars/CarBrandModelSelect';
import AiListingScore from '@/components/ai/AiListingScore';
import { supabase } from '@/db/supabase';
import {
  formatCurrency, formatDate, getStatusColor, getStatusLabelKey,
  PAKISTANI_CITIES, BODY_TYPES, FUEL_TYPES, COLORS, ENGINE_CAPACITIES,
  DRIVE_TYPES, CAR_FEATURES, DOORS_OPTIONS, SEATING_CAPACITY, CYLINDER_OPTIONS,
  YEARS,
} from '@/lib/utils-xyz';
import type { Car } from '@/types/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWebPConverter } from '@/hooks/useWebPConverter';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const PAGE_SIZE = 20;

interface CarBrand { id: string; name: string; }
interface CarModel { id: string; name: string; brand_id: string; }
interface CarVariant { id: string; name: string; model_id: string; }

type AddCarForm = {
  // Identity
  brand_id: string; model_id: string; variant_id: string;
  brand_name: string; model_name: string; variant_name: string;
  // Year
  year: string; registration_year: string;
  // Pricing
  price: string; is_negotiable: boolean; is_featured: boolean; status: string;
  // Core specs
  mileage: string; condition: string; fuel_type: string;
  transmission: string; body_type: string; color: string;
  engine_capacity: string; assembly: string; is_imported: boolean;
  drive_type: string; doors: string; seating_capacity: string; cylinders: string;
  // Location
  city: string; location: string;
  // Description
  description: string;
  // Features
  features: string[];
  // Optional identifiers
  chassis_number: string;
  // "Other" free-text overrides
  brand_other: string; model_other: string; variant_other: string; color_other: string;
};

const DEFAULT: AddCarForm = {
  brand_id: '', model_id: '', variant_id: '',
  brand_name: '', model_name: '', variant_name: '',
  year: String(new Date().getFullYear()),
  registration_year: String(new Date().getFullYear()),
  price: '', is_negotiable: true, is_featured: false, status: 'active',
  mileage: '', condition: 'used', fuel_type: 'Petrol',
  transmission: 'Automatic', body_type: 'Sedan', color: 'White',
  engine_capacity: '1800cc', assembly: 'Local', is_imported: false,
  drive_type: '', doors: '', seating_capacity: '', cylinders: '',
  city: 'Lahore', location: '',
  description: '',
  features: [],
  chassis_number: '',
  brand_other: '', model_other: '', variant_other: '', color_other: '',
};

export default function AdminInventory() {
  const { t } = useLanguage();
  const { convert: convertToWebP } = useWebPConverter();
  const { getSetting } = useSiteSettings();

  // List state
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [confirmBulk, setConfirmBulk] = useState(false);

  // Edit car dialog
  const [editCar, setEditCar] = useState<Car | null>(null);
  const [editForm, setEditForm] = useState<Partial<AddCarForm>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editContactType, setEditContactType] = useState<'admin'|'dealer'>('admin');

  // Add car dialog
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<AddCarForm>(DEFAULT);
  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [variants, setVariants] = useState<CarVariant[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Load list ───
  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('cars').select('*', { count: 'exact' });
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    if (search) q = q.or(`title.ilike.%${search}%,brand_name.ilike.%${search}%,model_name.ilike.%${search}%`);
    const { data, count, error: loadErr } = await q.order('created_at', { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (loadErr) {
      console.error('[AdminInventory] load error:', loadErr.message, loadErr.details);
    } else {
      setCars((data as Car[]) || []);
      setTotal(count || 0);
    }
    setLoading(false);
    setSelected(new Set());
  }, [search, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  // Load brands
  useEffect(() => {
    supabase.from('car_brands').select('id, name').order('name').then(({ data }) => {
      setBrands((data || []) as CarBrand[]);
    });
  }, []);

  // Load models when brand changes
  useEffect(() => {
    if (!form.brand_id) { setModels([]); setVariants([]); return; }
    supabase.from('car_models').select('id, name, brand_id').eq('brand_id', form.brand_id).order('name').then(({ data }) => {
      setModels((data || []) as CarModel[]);
    });
  }, [form.brand_id]);

  // Load variants when model changes
  useEffect(() => {
    if (!form.model_id) { setVariants([]); return; }
    supabase.from('car_variants').select('id, name, model_id').eq('model_id', form.model_id).order('name').then(({ data }) => {
      setVariants((data || []) as CarVariant[]);
    });
  }, [form.model_id]);

  const setF = (key: keyof AddCarForm, val: string | boolean | string[]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleBrandChange = (brandId: string) => {
    if (brandId === '__other__') {
      setForm(prev => ({ ...prev, brand_id: '__other__', brand_name: '', brand_other: '', model_id: '', model_name: '', model_other: '', variant_id: '', variant_name: '', variant_other: '' }));
      return;
    }
    const brand = brands.find(b => b.id === brandId);
    setForm(prev => ({ ...prev, brand_id: brandId, brand_name: brand?.name || '', brand_other: '', model_id: '', model_name: '', model_other: '', variant_id: '', variant_name: '', variant_other: '' }));
  };
  const handleModelChange = (modelId: string) => {
    if (modelId === '__other__') {
      setForm(prev => ({ ...prev, model_id: '__other__', model_name: '', model_other: '', variant_id: '', variant_name: '', variant_other: '' }));
      return;
    }
    const model = models.find(m => m.id === modelId);
    setForm(prev => ({ ...prev, model_id: modelId, model_name: model?.name || '', model_other: '', variant_id: '', variant_name: '', variant_other: '' }));
  };
  const handleVariantChange = (variantId: string) => {
    if (variantId === '__other__') {
      setForm(prev => ({ ...prev, variant_id: '__other__', variant_name: '', variant_other: '' }));
      return;
    }
    const variant = variants.find(v => v.id === variantId);
    setForm(prev => ({ ...prev, variant_id: variantId, variant_name: variant?.name || '', variant_other: '' }));
  };

  // Effective display values (resolve _other overrides)
  const effBrand   = form.brand_id   === '__other__' ? form.brand_other   : form.brand_name;
  const effModel   = form.model_id   === '__other__' ? form.model_other   : form.model_name;
  const effVariant = form.variant_id === '__other__' ? form.variant_other : form.variant_name;
  const effColor   = form.color      === 'Other'     ? form.color_other   : form.color;

  const toggleFeature = (feat: string) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.includes(feat)
        ? prev.features.filter(f => f !== feat)
        : [...prev.features, feat],
    }));
  };

  // ─── AI Description ───
  const generateAIDescription = async () => {
    if (!effBrand || !effModel) {
      toast.error('Fill in brand and model first');
      return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-car-description', {
        body: {
          brand_name: effBrand,
          model_name: effModel,
          variant_name: effVariant,
          year: form.year,
          registration_year: form.registration_year,
          price: form.price,
          mileage: form.mileage,
          condition: form.condition,
          fuel_type: form.fuel_type,
          transmission: form.transmission,
          body_type: form.body_type,
          color: effColor,
          engine_capacity: form.engine_capacity,
          assembly: form.assembly,
          city: form.city,
          is_imported: form.is_imported,
          drive_type: form.drive_type,
          doors: form.doors,
          seating_capacity: form.seating_capacity,
          cylinders: form.cylinders,
          features: form.features,
        },
      });
      if (error) {
        const msg = await error?.context?.text?.();
        toast.error(msg || 'AI generation failed');
      } else if (data?.description) {
        setF('description', data.description);
        toast.success('AI description generated');
      }
    } catch {
      toast.error('Failed to generate description');
    }
    setAiLoading(false);
  };

  // ─── Images ───
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const combined = [...imageFiles, ...files].slice(0, 8);
    setImageFiles(combined);
    const previews = await Promise.all(combined.map(f =>
      new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = ev => resolve(ev.target?.result as string);
        reader.readAsDataURL(f);
      })
    ));
    setPreviewImages(previews);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (idx: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviewImages(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadImages = async (carId: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of imageFiles) {
      try {
        const webpFile = await convertToWebP(file);
        const fname = `${carId}/${Date.now()}_${Math.random().toString(36).slice(2)}.webp`;
        const { error } = await supabase.storage.from('car-images').upload(fname, webpFile, { contentType: 'image/webp', upsert: true });
        if (!error) {
          const { data: urlData } = supabase.storage.from('car-images').getPublicUrl(fname);
          urls.push(urlData.publicUrl);
        }
      } catch { /* skip */ }
    }
    return urls;
  };

  // ─── Submit ───
  const handleSubmit = async () => {
    if (!effBrand || !effModel || !form.price || !form.year) {
      toast.error('Brand, model, year and price are required');
      return;
    }
    setSaving(true);
    try {
      const title = `${form.year} ${effBrand} ${effModel}${effVariant ? ' ' + effVariant : ''}`;
      const regYear = form.registration_year && form.registration_year !== 'Unregistered'
        ? parseInt(form.registration_year) : null;
      const { data: inserted, error } = await supabase.from('cars').insert({
        title,
        brand_id: form.brand_id !== '__other__' ? (form.brand_id || null) : null,
        model_id: form.model_id !== '__other__' ? (form.model_id || null) : null,
        variant_id: form.variant_id !== '__other__' ? (form.variant_id || null) : null,
        brand_name: effBrand,
        model_name: effModel,
        variant_name: effVariant || null,
        year: parseInt(form.year),
        registration_year: regYear,
        price: parseFloat(form.price.replace(/,/g, '')),
        mileage: form.mileage ? parseInt(form.mileage.replace(/,/g, '')) : 0,
        condition: form.condition,
        fuel_type: form.fuel_type,
        transmission: form.transmission,
        body_type: form.body_type,
        color: effColor,
        engine_capacity: form.engine_capacity,
        assembly: form.assembly,
        is_imported: form.is_imported,
        drive_type: (form.drive_type && form.drive_type !== 'none') ? form.drive_type : null,
        doors: (form.doors && form.doors !== 'none') ? parseInt(form.doors) : null,
        seating_capacity: (form.seating_capacity && form.seating_capacity !== 'none') ? parseInt(form.seating_capacity) : null,
        cylinders: (form.cylinders && form.cylinders !== 'none') ? parseInt(form.cylinders) : null,
        city: form.city,
        registration_city: form.city,
        location: form.location || form.city,
        description: form.description,
        is_negotiable: form.is_negotiable,
        is_featured: form.is_featured,
        status: form.status,
        features: form.features,
        show_contact_type: 'admin',
        images: [],
      }).select('id').maybeSingle();

      if (error || !inserted) { toast.error('Failed to create listing: ' + (error?.message || 'unknown')); setSaving(false); return; }

      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        imageUrls = await uploadImages(inserted.id);
        if (imageUrls.length > 0) {
          await supabase.from('cars').update({ images: imageUrls }).eq('id', inserted.id);
        }
      }

      toast.success('Car listing created successfully');
      setAddOpen(false);
      setForm(DEFAULT);
      setImageFiles([]);
      setPreviewImages([]);
      load();
    } catch (e) {
      toast.error('An error occurred while saving');
    }
    setSaving(false);
  };

  // ─── Edit dialog ───
  const openEditDialog = (car: Car) => {
    setEditCar(car);
    setEditForm({
      brand_name: car.brand_name || '',
      model_name: car.model_name || '',
      variant_name: car.variant_name || '',
      year: String(car.year || ''),
      registration_year: car.registration_year != null ? String(car.registration_year) : 'Unregistered',
      price: String(car.price || ''),
      is_negotiable: car.is_negotiable ?? false,
      is_featured: car.is_featured ?? false,
      status: car.status || 'active',
      mileage: String(car.mileage || ''),
      condition: car.condition || '',
      fuel_type: car.fuel_type || '',
      transmission: car.transmission || '',
      body_type: car.body_type || '',
      color: car.color || '',
      engine_capacity: car.engine_capacity || '',
      assembly: car.assembly || 'local',
      is_imported: car.is_imported ?? false,
      drive_type: car.drive_type || '',
      doors: car.doors != null ? String(car.doors) : '',
      seating_capacity: car.seating_capacity != null ? String(car.seating_capacity) : '',
      cylinders: car.cylinders != null ? String(car.cylinders) : '',
      city: car.city || '',
      description: car.description || '',
      chassis_number: car.chassis_number || '',
      brand_other: '',
      model_other: '',
      variant_other: '',
      color_other: '',
    });
    setEditContactType((car.show_contact_type as 'admin'|'dealer') || 'admin');
  };

  const saveEdit = async () => {
    if (!editCar) return;
    setEditSaving(true);
    const editEffColor = editForm.color === 'Other' ? (editForm.color_other || '') : (editForm.color || null);
    const editRegYear = editForm.registration_year && editForm.registration_year !== 'Unregistered'
      ? Number(editForm.registration_year) : null;
    const payload: Record<string, unknown> = {
      brand_name: editForm.brand_name,
      model_name: editForm.model_name,
      variant_name: editForm.variant_name || null,
      year: editForm.year ? Number(editForm.year) : null,
      registration_year: editRegYear,
      price: editForm.price ? Number(String(editForm.price).replace(/,/g, '')) : null,
      is_negotiable: editForm.is_negotiable ?? false,
      is_featured: editForm.is_featured ?? false,
      status: editForm.status || 'active',
      mileage: editForm.mileage ? Number(editForm.mileage) : null,
      condition: editForm.condition || null,
      fuel_type: editForm.fuel_type || null,
      transmission: editForm.transmission || null,
      body_type: editForm.body_type || null,
      color: editEffColor,
      engine_capacity: editForm.engine_capacity || null,
      assembly: editForm.assembly || 'local',
      is_imported: editForm.is_imported ?? false,
      drive_type: (editForm.drive_type && editForm.drive_type !== 'none') ? editForm.drive_type : null,
      doors: (editForm.doors && editForm.doors !== 'none') ? Number(editForm.doors) : null,
      seating_capacity: (editForm.seating_capacity && editForm.seating_capacity !== 'none') ? Number(editForm.seating_capacity) : null,
      cylinders: (editForm.cylinders && editForm.cylinders !== 'none') ? Number(editForm.cylinders) : null,
      city: editForm.city || null,
      description: editForm.description || null,
      chassis_number: editForm.chassis_number || null,
      show_contact_type: editContactType,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('cars').update(payload).eq('id', editCar.id);
    setEditSaving(false);
    if (error) { toast.error(`Failed to update: ${error.message}`); return; }
    toast.success('Listing updated successfully');
    setCars(prev => prev.map(c => c.id === editCar.id ? { ...c, show_contact_type: editContactType } : c));
    setEditCar(null);
    load();
  };

  // ─── List actions ───
  const approveOne = async (id: string) => {
    await supabase.from('cars').update({ status: 'active' }).eq('id', id);
    toast.success('Approved'); load();
  };
  const rejectOne = async (id: string) => {
    await supabase.from('cars').update({ status: 'inactive' }).eq('id', id);
    toast.success('Rejected'); load();
  };
  const deleteOne = async (id: string) => {
    await supabase.from('cars').delete().eq('id', id);
    toast.success('Deleted'); load();
  };
  const toggleContactType = async (car: Car) => {
    const next = car.show_contact_type === 'admin' ? 'dealer' : 'admin';
    await supabase.from('cars').update({ show_contact_type: next }).eq('id', car.id);
    setCars(prev => prev.map(c => c.id === car.id ? { ...c, show_contact_type: next } : c));
    toast.success(`Contact switched to ${next === 'admin' ? getSetting('site_name', 'Brand') : 'Dealer'}`);
  };
  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAll = () => {
    if (selected.size === cars.length) setSelected(new Set());
    else setSelected(new Set(cars.map(c => c.id)));
  };
  const executeBulk = async () => {
    if (!bulkAction || selected.size === 0) return;
    const ids = Array.from(selected);
    if (bulkAction === 'approve') { await supabase.from('cars').update({ status: 'active' }).in('id', ids); toast.success(`${ids.length} listings approved`); }
    else if (bulkAction === 'reject') { await supabase.from('cars').update({ status: 'inactive' }).in('id', ids); toast.success(`${ids.length} listings rejected`); }
    else if (bulkAction === 'delete') { await supabase.from('cars').delete().in('id', ids); toast.success(`${ids.length} listings deleted`); }
    setConfirmBulk(false); setBulkAction(''); load();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const closeDialog = () => { setAddOpen(false); setForm(DEFAULT); setImageFiles([]); setPreviewImages([]); };

  return (
    <AdminLayout>
      <TooltipProvider>
        <div className="p-4 md:p-6 space-y-5">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">Inventory Management</h1>
              <p className="text-sm text-muted-foreground">{total.toLocaleString()} total listings</p>
            </div>
            <Button size="sm" className="h-9 gap-1.5 shrink-0" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4" />Add New Car
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search listings..." className="pl-9 h-9 text-sm" />
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="h-9 text-sm w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selected.size} selected</Badge>
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="h-9 text-sm w-44"><SelectValue placeholder="Bulk action..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve Selected</SelectItem>
                    <SelectItem value="reject">Reject Selected</SelectItem>
                    <SelectItem value="delete">Delete Selected</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="ghost" className="h-9 border border-border" disabled={!bulkAction} onClick={() => setConfirmBulk(true)}>Apply</Button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="w-10 text-left px-4 py-3 whitespace-nowrap">
                      <Checkbox checked={selected.size === cars.length && cars.length > 0} onCheckedChange={toggleAll} />
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Vehicle</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap hidden md:table-cell">Price</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap hidden lg:table-cell">Seller</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap hidden md:table-cell">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap hidden lg:table-cell">Contact</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td colSpan={8} className="py-3 px-4"><Skeleton className="h-8 w-full" /></td>
                    </tr>
                  )) : cars.length === 0 ? (
                    <tr><td colSpan={8} className="py-12 text-center text-muted-foreground text-sm">No listings found</td></tr>
                  ) : cars.map(car => {
                    const contactType = car.show_contact_type || 'admin';
                    return (
                      <tr key={car.id} className={cn('border-b border-border last:border-0 hover:bg-muted/20 transition-colors', selected.has(car.id) && 'bg-primary/5')}>
                        <td className="px-4 py-3"><Checkbox checked={selected.has(car.id)} onCheckedChange={() => toggleSelect(car.id)} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                              {car.images?.[0] && <img src={car.images[0]} alt="" className="w-full h-full object-cover" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate max-w-[200px]">{car.title || `${car.brand_name} ${car.model_name}`}</p>
                              <p className="text-xs text-muted-foreground whitespace-nowrap">{car.year} · {car.city}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap">
                          <p className="text-sm font-semibold">{formatCurrency(car.price)}</p>
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3">
                          <p className="text-xs text-muted-foreground truncate max-w-[120px]">{car.dealership_name || 'Admin'}</p>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap">
                          <p className="text-xs text-muted-foreground">{formatDate(car.created_at)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cn('text-xs whitespace-nowrap', getStatusColor(car.status))}>{t(getStatusLabelKey(car.status || ''))}</Badge>
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button onClick={() => toggleContactType(car)}
                                className={cn(
                                  'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors',
                                  contactType === 'admin' ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                )}>
                                {contactType === 'admin' ? <><Building2 className="w-3 h-3" />{getSetting('site_name', 'Brand')}</> : <><Phone className="w-3 h-3" />Dealer</>}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">Click to toggle contact source</TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="w-7 h-7" asChild>
                              <Link to={`/car/${car.id}`} target="_blank"><Eye className="w-3.5 h-3.5" /></Link>
                            </Button>
                            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEditDialog(car)}><Pencil className="w-3.5 h-3.5" /></Button>
                            {car.status === 'pending_approval' && (
                              <>
                                <Button variant="ghost" size="icon" className="w-7 h-7 text-green-600 hover:text-green-700" onClick={() => approveOne(car.id)}><Check className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="w-7 h-7 text-orange-600 hover:text-orange-700" onClick={() => rejectOne(car.id)}><X className="w-3.5 h-3.5" /></Button>
                              </>
                            )}
                            <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => deleteOne(car.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 border border-border"><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 border border-border"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════ ADD CAR DIALOG ══════════════════════════════════════ */}
        <Dialog open={addOpen} onOpenChange={open => { if (!open) closeDialog(); else setAddOpen(true); }}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-4xl max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Add New Car Listing</DialogTitle>
            </DialogHeader>

            <div className="space-y-7 pt-1">

              {/* ── 1. Vehicle Identity ── */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-1.5">Vehicle Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Brand */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Brand *</Label>
                    <Select value={form.brand_id} onValueChange={handleBrandChange}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select brand" /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                        <SelectItem value="__other__">Other (specify)</SelectItem>
                      </SelectContent>
                    </Select>
                    <OtherInput trigger={form.brand_id === '__other__' ? 'Other' : form.brand_id} value={form.brand_other} onChange={v => setF('brand_other', v)} placeholder="Enter brand name" />
                  </div>
                  {/* Model */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Model *</Label>
                    <Select value={form.model_id} onValueChange={handleModelChange} disabled={!form.brand_id}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={form.brand_id ? 'Select model' : 'Select brand first'} /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        {models.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                        <SelectItem value="__other__">Other (specify)</SelectItem>
                      </SelectContent>
                    </Select>
                    <OtherInput trigger={form.model_id === '__other__' ? 'Other' : form.model_id} value={form.model_other} onChange={v => setF('model_other', v)} placeholder="Enter model name" />
                  </div>
                  {/* Variant */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Variant</Label>
                    <Select value={form.variant_id} onValueChange={handleVariantChange} disabled={!form.model_id}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={form.model_id ? 'Select variant' : 'Select model first'} /></SelectTrigger>
                      <SelectContent className="max-h-64">
                        {variants.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                        <SelectItem value="__other__">Other (specify)</SelectItem>
                      </SelectContent>
                    </Select>
                    <OtherInput trigger={form.variant_id === '__other__' ? 'Other' : form.variant_id} value={form.variant_other} onChange={v => setF('variant_other', v)} placeholder="Enter variant name" />
                  </div>
                </div>
              </section>

              {/* ── 2. Year & Registration ── */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-1.5">Year & Registration</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Model Year *</Label>
                    <Select value={form.year} onValueChange={v => setF('year', v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Registration Year</Label>
                    <Select value={form.registration_year} onValueChange={v => setF('registration_year', v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Unregistered">Unregistered</SelectItem>
                        {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Condition</Label>
                    <Select value={form.condition} onValueChange={v => setF('condition', v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="used">Used</SelectItem>
                        <SelectItem value="certified">Certified Pre-Owned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Mileage (km)</Label>
                    <Input value={form.mileage} onChange={e => setF('mileage', e.target.value)} placeholder="e.g. 25000" className="h-9 text-sm" />
                  </div>
                </div>
              </section>

              {/* ── 3. Engine & Drivetrain ── */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-1.5">Engine & Drivetrain</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Engine Capacity</Label>
                    <Select value={form.engine_capacity} onValueChange={v => setF('engine_capacity', v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{ENGINE_CAPACITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Fuel Type</Label>
                    <Select value={form.fuel_type} onValueChange={v => setF('fuel_type', v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{FUEL_TYPES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Transmission</Label>
                    <Select value={form.transmission} onValueChange={v => setF('transmission', v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Automatic">Automatic</SelectItem>
                        <SelectItem value="Manual">Manual</SelectItem>
                        <SelectItem value="CVT">CVT</SelectItem>
                        <SelectItem value="DCT">DCT / DSG</SelectItem>
                        <SelectItem value="AMT">AMT / AGS</SelectItem>
                        <SelectItem value="Semi-Automatic">Semi-Automatic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal text-muted-foreground">Drive Type <span className="text-xs">(optional)</span></Label>
                    <Select value={form.drive_type} onValueChange={v => setF('drive_type', v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Not specified" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not specified</SelectItem>
                        {DRIVE_TYPES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal text-muted-foreground">Cylinders <span className="text-xs">(optional)</span></Label>
                    <Select value={form.cylinders} onValueChange={v => setF('cylinders', v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Not specified" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not specified</SelectItem>
                        {CYLINDER_OPTIONS.map(c => <SelectItem key={c} value={String(c)}>{c} cyl</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              {/* ── 4. Body & Appearance ── */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-1.5">Body & Appearance</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Body Type</Label>
                    <Select value={form.body_type} onValueChange={v => setF('body_type', v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{BODY_TYPES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Color</Label>
                    <Select value={form.color} onValueChange={v => setF('color', v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{COLORS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                    <OtherInput trigger={form.color} value={form.color_other} onChange={v => setF('color_other', v)} placeholder="Enter color" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal text-muted-foreground">Doors <span className="text-xs">(optional)</span></Label>
                    <Select value={form.doors} onValueChange={v => setF('doors', v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Not specified" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not specified</SelectItem>
                        {DOORS_OPTIONS.map(d => <SelectItem key={d} value={String(d)}>{d} doors</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal text-muted-foreground">Seating Capacity <span className="text-xs">(optional)</span></Label>
                    <Select value={form.seating_capacity} onValueChange={v => setF('seating_capacity', v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Not specified" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not specified</SelectItem>
                        {SEATING_CAPACITY.map(s => <SelectItem key={s} value={String(s)}>{s} seats</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              {/* ── 5. Assembly & Location ── */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-1.5">Assembly & Location</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Assembly</Label>
                    <Select value={form.assembly} onValueChange={v => setF('assembly', v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Local">Local</SelectItem>
                        <SelectItem value="Imported">Imported</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">City</Label>
                    <Select value={form.city} onValueChange={v => setF('city', v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{PAKISTANI_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-sm font-normal">Location / Area</Label>
                    <Input value={form.location} onChange={e => setF('location', e.target.value)} placeholder="e.g. DHA Phase 5, Lahore" className="h-9 text-sm" />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox checked={form.is_imported} onCheckedChange={v => setF('is_imported', !!v)} />
                    Imported vehicle
                  </label>
                </div>
              </section>

              {/* ── 6. Pricing & Status ── */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-1.5">Pricing & Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5 col-span-2 md:col-span-1">
                    <Label className="text-sm font-normal">Price (PKR) *</Label>
                    <Input value={form.price} onChange={e => setF('price', e.target.value)} placeholder="e.g. 6500000" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Status</Label>
                    <Select value={form.status} onValueChange={v => setF('status', v)}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="pending_approval">Pending</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-normal">Options</Label>
                    <div className="flex items-center gap-5 h-9">
                      <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                        <Checkbox checked={form.is_negotiable} onCheckedChange={v => setF('is_negotiable', !!v)} />
                        Negotiable
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                        <Checkbox checked={form.is_featured} onCheckedChange={v => setF('is_featured', !!v)} />
                        Featured
                      </label>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── 7. Features ── */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-1.5">Features & Equipment</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {CAR_FEATURES.map(feat => (
                    <label key={feat} className="flex items-center gap-2 cursor-pointer text-sm py-1">
                      <Checkbox
                        checked={form.features.includes(feat)}
                        onCheckedChange={() => toggleFeature(feat)}
                        className="shrink-0"
                      />
                      <span className="leading-tight">{feat}</span>
                    </label>
                  ))}
                </div>
                {form.features.length > 0 && (
                  <p className="text-xs text-muted-foreground">{form.features.length} feature{form.features.length !== 1 ? 's' : ''} selected</p>
                )}
              </section>

              {/* ── 8. Description ── */}
              <section className="space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-1.5">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Description</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs border border-border"
                    onClick={generateAIDescription}
                    disabled={aiLoading}
                  >
                    {aiLoading
                      ? <><Loader2 className="w-3 h-3 animate-spin" />Generating...</>
                      : <><Sparkles className="w-3 h-3" />AI Generate</>}
                  </Button>
                </div>
                <Textarea
                  value={form.description}
                  onChange={e => setF('description', e.target.value)}
                  placeholder="Describe the vehicle — condition, history, notable features, reason for sale… or click AI Generate above."
                  className="min-h-[120px] text-sm resize-none"
                />
              </section>

              {/* ── 9. Photos ── */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border pb-1.5">Photos (max 8 · auto WebP)</h3>
                <div className="flex flex-wrap gap-2">
                  {previewImages.map((src, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {previewImages.length < 8 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ImagePlus className="w-5 h-5" />
                      <span className="text-[10px]">Add Photo</span>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                </div>
              </section>

              {/* ── Actions ── */}
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="ghost" onClick={closeDialog} disabled={saving} className="h-9 border border-border">Cancel</Button>
                <Button onClick={handleSubmit} disabled={saving} className="h-9 gap-1.5">
                  {saving
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving...</>
                    : <><Plus className="w-4 h-4" />Create Listing</>}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Confirm */}
        <AlertDialog open={confirmBulk} onOpenChange={setConfirmBulk}>
          <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
              <AlertDialogDescription>
                {bulkAction === 'delete' ? `Permanently delete ${selected.size} listings?` : `${bulkAction} ${selected.size} selected listings?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={executeBulk} className={bulkAction === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ══════════════════════════════════════ EDIT CAR DIALOG ══════════════════════════════════════ */}
        <Dialog open={!!editCar} onOpenChange={open => { if (!open) setEditCar(null); }}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-3xl max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Edit Listing — {editCar?.title || `${editCar?.brand_name} ${editCar?.model_name}`}</DialogTitle>
            </DialogHeader>
            {editCar && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                {/* Status + Contact Type (side by side) */}
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Status</Label>
                  <Select value={editForm.status || 'active'} onValueChange={v => setEditForm(p => ({ ...p, status: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                      <SelectItem value="pending_approval">Pending Approval</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Contact Shown To Buyers</Label>
                  <Select value={editContactType} onValueChange={v => setEditContactType(v as 'admin'|'dealer')}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">{getSetting('site_name', 'XYZ Automobiles')} (default)</SelectItem>
                      <SelectItem value="dealer">Dealer Contact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Brand */}
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Brand</Label>
                  <Input className="h-9 text-sm" value={editForm.brand_name || ''} onChange={e => setEditForm(p => ({ ...p, brand_name: e.target.value }))} />
                </div>
                {/* Model */}
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Model</Label>
                  <Input className="h-9 text-sm" value={editForm.model_name || ''} onChange={e => setEditForm(p => ({ ...p, model_name: e.target.value }))} />
                </div>
                {/* Variant */}
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Variant</Label>
                  <Input className="h-9 text-sm" value={editForm.variant_name || ''} onChange={e => setEditForm(p => ({ ...p, variant_name: e.target.value }))} />
                </div>
                {/* Year */}
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Year</Label>
                  <Select value={editForm.year || ''} onValueChange={v => setEditForm(p => ({ ...p, year: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select year" /></SelectTrigger>
                    <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {/* Registration Year */}
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Registration Year</Label>
                  <Select value={editForm.registration_year || ''} onValueChange={v => setEditForm(p => ({ ...p, registration_year: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select reg. year" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unregistered">Unregistered</SelectItem>
                      {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {/* Price */}
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Price (PKR)</Label>
                  <Input className="h-9 text-sm" type="number" value={editForm.price || ''} onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))} />
                </div>
                {/* Mileage */}
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Mileage (km)</Label>
                  <Input className="h-9 text-sm" type="number" value={editForm.mileage || ''} onChange={e => setEditForm(p => ({ ...p, mileage: e.target.value }))} />
                </div>
                {/* City */}
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">City</Label>
                  <Select value={editForm.city || ''} onValueChange={v => setEditForm(p => ({ ...p, city: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent>{PAKISTANI_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {/* Condition */}
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Condition</Label>
                  <Select value={editForm.condition || ''} onValueChange={v => setEditForm(p => ({ ...p, condition: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select condition" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="used">Used</SelectItem>
                      <SelectItem value="certified">Certified Pre-Owned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Fuel Type */}
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Fuel Type</Label>
                  <Select value={editForm.fuel_type || ''} onValueChange={v => setEditForm(p => ({ ...p, fuel_type: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select fuel type" /></SelectTrigger>
                    <SelectContent>{FUEL_TYPES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {/* Transmission */}
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Transmission</Label>
                  <Select value={editForm.transmission || ''} onValueChange={v => setEditForm(p => ({ ...p, transmission: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select transmission" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automatic">Automatic</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="cvt">CVT</SelectItem>
                      <SelectItem value="semi-automatic">Semi-Automatic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Body Type */}
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Body Type</Label>
                  <Select value={editForm.body_type || ''} onValueChange={v => setEditForm(p => ({ ...p, body_type: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select body type" /></SelectTrigger>
                    <SelectContent>{BODY_TYPES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {/* Color */}
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Color</Label>
                  <Select value={editForm.color || ''} onValueChange={v => setEditForm(p => ({ ...p, color: v, color_other: '' }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select color" /></SelectTrigger>
                    <SelectContent>{COLORS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <OtherInput trigger={editForm.color || ''} value={editForm.color_other || ''} onChange={v => setEditForm(p => ({ ...p, color_other: v }))} placeholder="Enter color" />
                </div>
                {/* Engine */}
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Engine Capacity</Label>
                  <Select value={editForm.engine_capacity || ''} onValueChange={v => setEditForm(p => ({ ...p, engine_capacity: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select engine" /></SelectTrigger>
                    <SelectContent>{ENGINE_CAPACITIES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {/* Assembly */}
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Assembly</Label>
                  <Select value={editForm.assembly || 'local'} onValueChange={v => setEditForm(p => ({ ...p, assembly: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="imported">Imported</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Drive Type (optional) */}
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Drive Type <span className="text-muted-foreground">(optional)</span></Label>
                  <Select value={editForm.drive_type || 'none'} onValueChange={v => setEditForm(p => ({ ...p, drive_type: v === 'none' ? '' : v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Not specified" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      {DRIVE_TYPES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {/* Cylinders (optional) */}
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Cylinders <span className="text-muted-foreground">(optional)</span></Label>
                  <Select value={editForm.cylinders || 'none'} onValueChange={v => setEditForm(p => ({ ...p, cylinders: v === 'none' ? '' : v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Not specified" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      {CYLINDER_OPTIONS.map(c => <SelectItem key={c} value={String(c)}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {/* Doors (optional) */}
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Doors <span className="text-muted-foreground">(optional)</span></Label>
                  <Select value={editForm.doors || 'none'} onValueChange={v => setEditForm(p => ({ ...p, doors: v === 'none' ? '' : v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Not specified" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      {DOORS_OPTIONS.map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {/* Seating (optional) */}
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Seating Capacity <span className="text-muted-foreground">(optional)</span></Label>
                  <Select value={editForm.seating_capacity || 'none'} onValueChange={v => setEditForm(p => ({ ...p, seating_capacity: v === 'none' ? '' : v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Not specified" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      {SEATING_CAPACITY.map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {/* Chassis */}
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Chassis Number <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input className="h-9 text-sm" value={editForm.chassis_number || ''} onChange={e => setEditForm(p => ({ ...p, chassis_number: e.target.value }))} />
                </div>
                {/* Checkboxes */}
                <div className="md:col-span-2 flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={!!editForm.is_negotiable} onCheckedChange={v => setEditForm(p => ({ ...p, is_negotiable: !!v }))} />
                    <span className="text-sm">Negotiable</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={!!editForm.is_featured} onCheckedChange={v => setEditForm(p => ({ ...p, is_featured: !!v }))} />
                    <span className="text-sm">Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={!!editForm.is_imported} onCheckedChange={v => setEditForm(p => ({ ...p, is_imported: !!v }))} />
                    <span className="text-sm">Imported</span>
                  </label>
                </div>
                {/* Description */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-normal mb-1.5 block">Description</Label>
                  <Textarea className="text-sm resize-none" rows={4} value={editForm.description || ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                {/* AI Listing Score */}
                <div className="md:col-span-2">
                  <AiListingScore car={editCar!} />
                </div>

                {/* Footer buttons */}
                <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-border">
                  <Button variant="ghost" className="border border-border h-9" onClick={() => setEditCar(null)}>Cancel</Button>
                  <Button className="h-9" onClick={saveEdit} disabled={editSaving}>
                    {editSaving ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Saving...</> : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </TooltipProvider>
    </AdminLayout>
  );
}
