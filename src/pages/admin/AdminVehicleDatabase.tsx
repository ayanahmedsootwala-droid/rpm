import { useState, useEffect, useRef } from 'react';
import * as jsyaml from 'js-yaml';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Plus, Pencil, Trash2, Search, ChevronRight, CheckCircle, Upload, Download, AlertTriangle, Globe, RefreshCw } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import type { CarBrand, CarModel, CarVariant } from '@/types/types';


// ─── Multi-format import helpers ─────────────────────────────────────────────
type ImportFormat = 'json' | 'csv' | 'yaml';

/** Parse CSV with header row: brand,country_of_origin,brand_type,model,variant */
function parseCsvToImport(csv: string): unknown[] {
  const lines = csv.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  const brandMap = new Map<string, { name: string; country_of_origin?: string; brand_type?: string; models: Map<string, Set<string>> }>();
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = cols[idx] || ''; });
    const brand = row['brand'] || row['brand_name'] || '';
    if (!brand) continue;
    if (!brandMap.has(brand)) {
      brandMap.set(brand, { name: brand, country_of_origin: row['country_of_origin'], brand_type: row['brand_type'] || 'other', models: new Map() });
    }
    const entry = brandMap.get(brand)!;
    const model = row['model'] || row['model_name'] || '';
    if (!model) continue;
    if (!entry.models.has(model)) entry.models.set(model, new Set());
    const variant = row['variant'] || row['variant_name'] || '';
    if (variant) entry.models.get(model)!.add(variant);
  }
  return Array.from(brandMap.values()).map(b => ({
    name: b.name,
    country_of_origin: b.country_of_origin,
    brand_type: b.brand_type,
    models: Array.from(b.models.entries()).map(([mName, variants]) => ({
      name: mName,
      variants: Array.from(variants),
    })),
  }));
}

function detectFormat(filename: string, text: string): ImportFormat {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'csv') return 'csv';
  if (ext === 'yaml' || ext === 'yml') return 'yaml';
  const trimmed = text.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) return 'json';
  if (trimmed.includes(',') && trimmed.includes('\n') && !trimmed.startsWith('-')) return 'csv';
  return 'yaml';
}

function parseImportText(text: string, format: ImportFormat): unknown[] {
  if (format === 'json') {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  }
  if (format === 'csv') return parseCsvToImport(text);
  // yaml
  const parsed = jsyaml.load(text);
  return Array.isArray(parsed) ? parsed : [parsed as unknown];
}

const BRAND_TYPES = [
  { value: 'all', label: 'All Brands' },
  { value: 'japanese', label: '🇯🇵 Japanese' },
  { value: 'chinese', label: '🇨🇳 Chinese' },
  { value: 'korean', label: '🇰🇷 Korean' },
  { value: 'european', label: '🇪🇺 European' },
  { value: 'american', label: '🇺🇸 American' },
  { value: 'other', label: 'Other' },
];

const JSON_TEMPLATE = JSON.stringify([
  {
    name: "BrandName",
    country_of_origin: "Japan",
    brand_type: "japanese",
    models: [
      {
        name: "ModelName",
        variants: ["Variant 1", "Variant 2", "Other"]
      }
    ]
  }
], null, 2);

const CSV_TEMPLATE = `brand,country_of_origin,brand_type,model,variant
Toyota,Japan,japanese,Corolla,1.6 MT
Toyota,Japan,japanese,Corolla,1.8 AT
Toyota,Japan,japanese,Camry,2.5 Grande
Honda,Japan,japanese,Civic,1.5 Turbo
Honda,Japan,japanese,Civic,RS Turbo`;

const YAML_TEMPLATE = `- name: Toyota
  country_of_origin: Japan
  brand_type: japanese
  models:
    - name: Corolla
      variants:
        - 1.6 MT
        - 1.8 AT
    - name: Camry
      variants:
        - 2.5 Grande
- name: Honda
  country_of_origin: Japan
  brand_type: japanese
  models:
    - name: Civic
      variants:
        - 1.5 Turbo
        - RS Turbo`;

const FORMAT_TEMPLATES: Record<ImportFormat, string> = {
  json: JSON_TEMPLATE,
  csv: CSV_TEMPLATE,
  yaml: YAML_TEMPLATE,
};

// Typed shape for imported records
interface ImportItem {
  name?: string;
  country_of_origin?: string;
  brand_type?: string;
  models?: Array<{ name?: string; variants?: string[] }>;
}

export default function AdminVehicleDatabase() {
  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [variants, setVariants] = useState<CarVariant[]>([]);
  const [search, setSearch] = useState('');
  const [brandTypeFilter, setBrandTypeFilter] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState<CarBrand | null>(null);
  const [selectedModel, setSelectedModel] = useState<CarModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'brand' | 'model' | 'variant'; id: string; name: string } | null>(null);

  const [brandDialog, setBrandDialog] = useState<{ open: boolean; item?: CarBrand }>({ open: false });
  const [modelDialog, setModelDialog] = useState<{ open: boolean; item?: CarModel }>({ open: false });
  const [variantDialog, setVariantDialog] = useState<{ open: boolean; item?: CarVariant }>({ open: false });
  const [jsonDialog, setJsonDialog] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [importFormat, setImportFormat] = useState<ImportFormat>('json');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; skipped: number; errors: string[] } | null>(null);
  const jsonFileRef = useRef<HTMLInputElement>(null);

  const brandForm = useForm<{ name: string; country_of_origin: string; brand_type: string }>({
    defaultValues: { name: '', country_of_origin: '', brand_type: 'other' }
  });
  const modelForm = useForm<{ name: string }>({ defaultValues: { name: '' } });
  const variantForm = useForm<{ name: string }>({ defaultValues: { name: '' } });

  useEffect(() => { loadBrands(); }, []);
  useEffect(() => {
    if (selectedBrand) loadModels(selectedBrand.id);
    else { setModels([]); setSelectedModel(null); setVariants([]); }
  }, [selectedBrand]);
  useEffect(() => {
    if (selectedModel) loadVariants(selectedModel.id);
    else setVariants([]);
  }, [selectedModel]);

  async function loadBrands() {
    setLoading(true);
    const { data } = await supabase.from('car_brands').select('*').order('display_order').order('name');
    if (data) setBrands(data as CarBrand[]);
    setLoading(false);
  }
  async function loadModels(brandId: string) {
    const { data } = await supabase.from('car_models').select('*').eq('brand_id', brandId).order('name');
    if (data) setModels(data as CarModel[]);
  }
  async function loadVariants(modelId: string) {
    const { data } = await supabase.from('car_variants').select('*').eq('model_id', modelId).order('name');
    if (data) setVariants(data as CarVariant[]);
  }

  // ── Brand CRUD ────────────────────────────────────────────────────────────
  const openAddBrand = () => {
    brandForm.reset({ name: '', country_of_origin: '', brand_type: 'other' });
    setBrandDialog({ open: true });
  };
  const openEditBrand = (b: CarBrand) => {
    brandForm.reset({ name: b.name, country_of_origin: b.country_of_origin || '', brand_type: (b as any).brand_type || 'other' });
    setBrandDialog({ open: true, item: b });
  };
  const saveBrand = async (vals: { name: string; country_of_origin: string; brand_type: string }) => {
    const trimmed = vals.name.trim();
    if (!trimmed) return;
    // Duplicate check
    const dup = brands.find(b => b.name.toLowerCase() === trimmed.toLowerCase() && b.id !== brandDialog.item?.id);
    if (dup) { toast.error(`Brand "${trimmed}" already exists`); return; }
    if (brandDialog.item) {
      await supabase.from('car_brands').update({ name: trimmed, country_of_origin: vals.country_of_origin, brand_type: vals.brand_type }).eq('id', brandDialog.item.id);
      toast.success('Brand updated');
    } else {
      await supabase.from('car_brands').insert({ name: trimmed, country_of_origin: vals.country_of_origin, brand_type: vals.brand_type, is_active: true });
      toast.success('Brand added');
    }
    setBrandDialog({ open: false });
    loadBrands();
  };

  // ── Model CRUD ─────────────────────────────────────────────────────────────
  const openAddModel = () => { modelForm.reset({ name: '' }); setModelDialog({ open: true }); };
  const openEditModel = (m: CarModel) => { modelForm.reset({ name: m.name }); setModelDialog({ open: true, item: m }); };
  const saveModel = async (vals: { name: string }) => {
    if (!selectedBrand) return;
    const trimmed = vals.name.trim();
    const dup = models.find(m => m.name.toLowerCase() === trimmed.toLowerCase() && m.id !== modelDialog.item?.id);
    if (dup) { toast.error(`Model "${trimmed}" already exists for this brand`); return; }
    if (modelDialog.item) {
      await supabase.from('car_models').update({ name: trimmed }).eq('id', modelDialog.item.id);
      toast.success('Model updated');
    } else {
      await supabase.from('car_models').insert({ name: trimmed, brand_id: selectedBrand.id, is_active: true });
      toast.success('Model added');
    }
    setModelDialog({ open: false });
    loadModels(selectedBrand.id);
  };

  // ── Variant CRUD ───────────────────────────────────────────────────────────
  const openAddVariant = () => { variantForm.reset({ name: '' }); setVariantDialog({ open: true }); };
  const openEditVariant = (v: CarVariant) => { variantForm.reset({ name: v.name }); setVariantDialog({ open: true, item: v }); };
  const saveVariant = async (vals: { name: string }) => {
    if (!selectedModel) return;
    const trimmed = vals.name.trim();
    const dup = variants.find(v => v.name.toLowerCase() === trimmed.toLowerCase() && v.id !== variantDialog.item?.id);
    if (dup) { toast.error(`Variant "${trimmed}" already exists for this model`); return; }
    if (variantDialog.item) {
      await supabase.from('car_variants').update({ name: trimmed }).eq('id', variantDialog.item.id);
      toast.success('Variant updated');
    } else {
      await supabase.from('car_variants').insert({ name: trimmed, model_id: selectedModel.id, is_active: true });
      toast.success('Variant added');
    }
    setVariantDialog({ open: false });
    loadVariants(selectedModel.id);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    if (type === 'brand') {
      await supabase.from('car_brands').delete().eq('id', id);
      setSelectedBrand(null);
      loadBrands();
    } else if (type === 'model') {
      await supabase.from('car_models').delete().eq('id', id);
      setSelectedModel(null);
      if (selectedBrand) loadModels(selectedBrand.id);
    } else {
      await supabase.from('car_variants').delete().eq('id', id);
      if (selectedModel) loadVariants(selectedModel.id);
    }
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted`);
    setDeleteTarget(null);
  };

  // ── Multi-format Import ───────────────────────────────────────────────────
  const handleJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      setJsonText(text);
      setImportFormat(detectFormat(file.name, text));
    };
    reader.readAsText(file);
    // reset so same file can be re-selected
    e.target.value = '';
  };

  const runJsonImport = async () => {
    setImporting(true);
    setImportResult(null);
    const result = { added: 0, skipped: 0, errors: [] as string[] };
    try {
      const items = parseImportText(jsonText, importFormat) as ImportItem[];

      // Fetch current state
      const { data: existingBrands } = await supabase.from('car_brands').select('id, name');
      const brandMap = new Map<string, string>((existingBrands || []).map((b: any) => [b.name.toLowerCase(), b.id]));

      for (const item of items) {
        if (!item.name) { result.errors.push('Item missing name'); continue; }
        const bNameLower = item.name.trim().toLowerCase();

        let brandId = brandMap.get(bNameLower);
        if (!brandId) {
          const { data: nb } = await supabase.from('car_brands').insert({
            name: item.name.trim(),
            country_of_origin: item.country_of_origin || '',
            brand_type: item.brand_type || 'other',
            is_active: true
          }).select('id').maybeSingle();
          if (nb?.id) { brandId = nb.id as string; brandMap.set(bNameLower, brandId); result.added++; }
          else { result.errors.push(`Failed to add brand: ${item.name}`); continue; }
        } else {
          result.skipped++;
        }

        if (!Array.isArray(item.models)) continue;

        // Fetch existing models for this brand
        const { data: existingModels } = await supabase.from('car_models').select('id, name').eq('brand_id', brandId);
        const modelMap = new Map<string, string>((existingModels || []).map((m: any) => [m.name.toLowerCase(), m.id]));

        for (const model of item.models) {
          if (!model.name) continue;
          const mNameLower = model.name.trim().toLowerCase();
          let modelId = modelMap.get(mNameLower);
          if (!modelId) {
            const { data: nm } = await supabase.from('car_models').insert({
              name: model.name.trim(), brand_id: brandId, is_active: true
            }).select('id').maybeSingle();
            if (nm?.id) { modelId = nm.id as string; modelMap.set(mNameLower, modelId); result.added++; }
            else { result.errors.push(`Failed to add model: ${model.name}`); continue; }
          } else { result.skipped++; }

          if (!Array.isArray(model.variants)) continue;
          const { data: existingVariants } = await supabase.from('car_variants').select('name').eq('model_id', modelId);
          const variantSet = new Set((existingVariants || []).map((v: any) => v.name.toLowerCase()));

          for (const variantName of model.variants) {
            if (!variantName) continue;
            const vLower = variantName.trim().toLowerCase();
            if (!variantSet.has(vLower)) {
              const { error } = await supabase.from('car_variants').insert({ name: variantName.trim(), model_id: modelId, is_active: true });
              if (!error) { result.added++; variantSet.add(vLower); }
              else result.errors.push(`Failed to add variant: ${variantName}`);
            } else { result.skipped++; }
          }
        }
      }
    } catch (e: any) {
      result.errors.push(`Parse error (${importFormat}): ${e.message}`);
    }
    setImportResult(result);
    setImporting(false);
    if (result.errors.length === 0) {
      toast.success(`Import complete: ${result.added} added, ${result.skipped} duplicates skipped`);
      loadBrands();
    } else {
      toast.error(`Import finished with ${result.errors.length} errors`);
    }
  };

  const filteredBrands = brands.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = brandTypeFilter === 'all' || (b as any).brand_type === brandTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Vehicle Database</h1>
            <p className="text-sm text-muted-foreground">{brands.length} brands · Manage all car brands, models & variants</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { setJsonText(''); setImportFormat('json'); setImportResult(null); setJsonDialog(true); }} className="h-8">
              <Upload className="w-3.5 h-3.5 mr-1.5" />Import Data
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              const blob = new Blob([JSON_TEMPLATE], { type: 'application/json' });
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'vehicle_db_template.json'; a.click();
            }} className="h-8">
              <Download className="w-3.5 h-3.5 mr-1.5" />Template
            </Button>
          </div>
        </div>

        <Tabs defaultValue="browse">
          <TabsList>
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Brands Column */}
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Brands</CardTitle>
                    <Button size="sm" variant="ghost" onClick={openAddBrand} className="h-7 px-2 text-xs border border-border">
                      <Plus className="w-3 h-3 mr-1" />Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search brands..." className="pl-8 h-8 text-xs" />
                    </div>
                    <Select value={brandTypeFilter} onValueChange={setBrandTypeFilter}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BRAND_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-y-auto max-h-[480px]">
                    {loading ? <div className="p-4 text-xs text-muted-foreground">Loading...</div> :
                      filteredBrands.map(b => (
                        <div key={b.id}
                          onClick={() => { setSelectedBrand(b === selectedBrand ? null : b); setSelectedModel(null); }}
                          className={`flex items-center justify-between px-4 py-2.5 cursor-pointer border-b border-border last:border-0 hover:bg-muted/40 transition-colors ${selectedBrand?.id === b.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{b.name}</p>
                            <p className="text-xs text-muted-foreground">{b.country_of_origin || '—'}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={e => { e.stopPropagation(); openEditBrand(b); }}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-6 h-6 text-destructive" onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'brand', id: b.id, name: b.name }); }}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                            {selectedBrand?.id === b.id && <ChevronRight className="w-3.5 h-3.5 text-primary" />}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>

              {/* Models Column */}
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">Models</CardTitle>
                      {selectedBrand && <CardDescription className="text-xs">{selectedBrand.name}</CardDescription>}
                    </div>
                    {selectedBrand && (
                      <Button size="sm" variant="ghost" onClick={openAddModel} className="h-7 px-2 text-xs border border-border">
                        <Plus className="w-3 h-3 mr-1" />Add
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-y-auto max-h-[480px]">
                    {!selectedBrand ? (
                      <div className="p-6 text-center text-xs text-muted-foreground">Select a brand</div>
                    ) : models.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">No models yet</div>
                    ) : models.map(m => (
                      <div key={m.id}
                        onClick={() => setSelectedModel(m === selectedModel ? null : m)}
                        className={`flex items-center justify-between px-4 py-2.5 cursor-pointer border-b border-border last:border-0 hover:bg-muted/40 transition-colors ${selectedModel?.id === m.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}>
                        <p className="text-sm flex-1">{m.name}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="w-6 h-6" onClick={e => { e.stopPropagation(); openEditModel(m); }}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-6 h-6 text-destructive" onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'model', id: m.id, name: m.name }); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          {selectedModel?.id === m.id && <ChevronRight className="w-3.5 h-3.5 text-primary" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Variants Column */}
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">Variants</CardTitle>
                      {selectedModel && <CardDescription className="text-xs">{selectedModel.name}</CardDescription>}
                    </div>
                    {selectedModel && (
                      <Button size="sm" variant="ghost" onClick={openAddVariant} className="h-7 px-2 text-xs border border-border">
                        <Plus className="w-3 h-3 mr-1" />Add
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-y-auto max-h-[480px]">
                    {!selectedModel ? (
                      <div className="p-6 text-center text-xs text-muted-foreground">Select a model</div>
                    ) : variants.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">No variants yet</div>
                    ) : variants.map(v => (
                      <div key={v.id} className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/40">
                        <div className="flex items-center gap-2 flex-1">
                          <CheckCircle className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                          <p className="text-sm">{v.name}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => openEditVariant(v)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-6 h-6 text-destructive" onClick={() => setDeleteTarget({ type: 'variant', id: v.id, name: v.name })}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Brands', value: brands.length },
                { label: 'Japanese', value: brands.filter(b => (b as any).brand_type === 'japanese').length },
                { label: 'Chinese', value: brands.filter(b => (b as any).brand_type === 'chinese').length },
                { label: 'Korean', value: brands.filter(b => (b as any).brand_type === 'korean').length },
              ].map(s => (
                <Card key={s.label}>
                  <CardContent className="p-4">
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Brand Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {BRAND_TYPES.filter(t => t.value !== 'all').map(t => {
                    const count = brands.filter(b => (b as any).brand_type === t.value).length;
                    const pct = brands.length ? Math.round(count / brands.length * 100) : 0;
                    return (
                      <div key={t.value} className="flex items-center gap-3">
                        <span className="text-xs w-24 text-muted-foreground">{t.label}</span>
                        <div className="flex-1 bg-muted rounded-full h-1.5">
                          <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Brand Dialog */}
      <Dialog open={brandDialog.open} onOpenChange={o => setBrandDialog({ open: o })}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader><DialogTitle>{brandDialog.item ? 'Edit Brand' : 'Add Brand'}</DialogTitle></DialogHeader>
          <Form {...brandForm}>
            <form onSubmit={brandForm.handleSubmit(saveBrand)} className="space-y-4">
              <FormField control={brandForm.control} name="name" rules={{ required: 'Name is required' }} render={({ field }) => (
                <FormItem><FormLabel>Brand Name</FormLabel><FormControl><Input {...field} placeholder="e.g. Toyota" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={brandForm.control} name="country_of_origin" render={({ field }) => (
                <FormItem><FormLabel>Country of Origin</FormLabel><FormControl><Input {...field} placeholder="e.g. Japan" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={brandForm.control} name="brand_type" render={({ field }) => (
                <FormItem><FormLabel>Brand Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {BRAND_TYPES.filter(t => t.value !== 'all').map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setBrandDialog({ open: false })}>Cancel</Button>
                <Button type="submit">Save Brand</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Model Dialog */}
      <Dialog open={modelDialog.open} onOpenChange={o => setModelDialog({ open: o })}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader><DialogTitle>{modelDialog.item ? 'Edit Model' : `Add Model — ${selectedBrand?.name}`}</DialogTitle></DialogHeader>
          <Form {...modelForm}>
            <form onSubmit={modelForm.handleSubmit(saveModel)} className="space-y-4">
              <FormField control={modelForm.control} name="name" rules={{ required: 'Name is required' }} render={({ field }) => (
                <FormItem><FormLabel>Model Name</FormLabel><FormControl><Input {...field} placeholder="e.g. Corolla" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setModelDialog({ open: false })}>Cancel</Button>
                <Button type="submit">Save Model</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Variant Dialog */}
      <Dialog open={variantDialog.open} onOpenChange={o => setVariantDialog({ open: o })}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader><DialogTitle>{variantDialog.item ? 'Edit Variant' : `Add Variant — ${selectedModel?.name}`}</DialogTitle></DialogHeader>
          <Form {...variantForm}>
            <form onSubmit={variantForm.handleSubmit(saveVariant)} className="space-y-4">
              <FormField control={variantForm.control} name="name" rules={{ required: 'Name is required' }} render={({ field }) => (
                <FormItem><FormLabel>Variant Name</FormLabel><FormControl><Input {...field} placeholder="e.g. 1.8 Altis Grande" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setVariantDialog({ open: false })}>Cancel</Button>
                <Button type="submit">Save Variant</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Multi-format Import Dialog */}
      <Dialog open={jsonDialog} onOpenChange={setJsonDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Upload className="w-4 h-4" />Import Vehicle Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Format selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground shrink-0">Format:</span>
              <div className="flex rounded-md border border-border overflow-hidden">
                {(['json','csv','yaml'] as ImportFormat[]).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => { setImportFormat(fmt); setJsonText(''); setImportResult(null); }}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${importFormat === fmt ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs ml-auto" onClick={() => {
                const ext = importFormat === 'yaml' ? 'yaml' : importFormat;
                const mime = importFormat === 'json' ? 'application/json' : 'text/plain';
                const blob = new Blob([FORMAT_TEMPLATES[importFormat]], { type: mime });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                a.download = `vehicle_template.${ext}`; a.click();
              }}>
                <Download className="w-3 h-3 mr-1" />Template
              </Button>
            </div>

            {/* Format hints */}
            {importFormat === 'csv' && (
              <p className="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2 border border-border">
                CSV columns: <code className="font-mono">brand, country_of_origin, brand_type, model, variant</code> — one row per brand+model+variant combination.
              </p>
            )}
            {importFormat === 'yaml' && (
              <p className="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2 border border-border">
                YAML: list of brand objects each with <code className="font-mono">name</code>, <code className="font-mono">brand_type</code>, and <code className="font-mono">models[]</code> containing <code className="font-mono">name</code> + <code className="font-mono">variants[]</code>.
              </p>
            )}

            {/* File / paste area */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => jsonFileRef.current?.click()}>
                <Upload className="w-3.5 h-3.5 mr-1.5" />Choose File
              </Button>
              <input ref={jsonFileRef} type="file" accept=".json,.csv,.yaml,.yml" className="hidden" onChange={handleJsonFile} />
              <span className="text-xs text-muted-foreground">or paste {importFormat.toUpperCase()} below</span>
            </div>
            <Textarea
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              placeholder={FORMAT_TEMPLATES[importFormat]}
              className="font-mono text-xs min-h-[200px]"
            />

            {/* Duplicate detection notice */}
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border border-border text-xs text-muted-foreground">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
              <span>Duplicate detection enabled — existing brands, models, and variants will be skipped automatically.</span>
            </div>

            {importResult && (
              <div className="p-3 border border-border rounded-lg space-y-1.5">
                <div className="flex items-center gap-3 text-sm">
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{importResult.added} Added</Badge>
                  <Badge variant="secondary">{importResult.skipped} Skipped (duplicates)</Badge>
                  {importResult.errors.length > 0 && <Badge className="bg-destructive/10 text-destructive">{importResult.errors.length} Errors</Badge>}
                </div>
                {importResult.errors.length > 0 && (
                  <ul className="text-xs text-destructive space-y-0.5 max-h-24 overflow-y-auto">
                    {importResult.errors.map((e, i) => <li key={i}>• {e}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJsonDialog(false)}>Close</Button>
            <Button onClick={runJsonImport} disabled={!jsonText.trim() || importing}>
              {importing ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Importing...</> : <><Upload className="w-3.5 h-3.5 mr-1.5" />Import</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type}</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleteTarget?.name}</strong>? This will also remove all associated records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
