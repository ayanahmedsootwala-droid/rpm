import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Check, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { supabase } from '@/db/supabase';
import type { CarBrand } from '@/types/types';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const EMPTY = { name: '', logo_url: '', country_of_origin: '', is_active: true };

export default function AdminBrands() {
  const { t } = useLanguage();
  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<CarBrand | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    supabase.from('car_brands').select('*').order('name').then(({ data }) => {
      if (data) setBrands(data as CarBrand[]);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditItem(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (b: CarBrand) => {
    setEditItem(b);
    setForm({ name: b.name || '', logo_url: b.logo_url || '', country_of_origin: b.country_of_origin || '', is_active: b.is_active !== false });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editItem) {
        await supabase.from('car_brands').update({ name: form.name, logo_url: form.logo_url || null, country_of_origin: form.country_of_origin || null, is_active: form.is_active }).eq('id', editItem.id);
        toast.success('Brand updated');
      } else {
        await supabase.from('car_brands').insert({ name: form.name, logo_url: form.logo_url || null, country_of_origin: form.country_of_origin || null, is_active: form.is_active });
        toast.success('Brand added');
      }
      setDialogOpen(false); load();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const deleteBrand = async () => {
    if (!deleteId) return;
    await supabase.from('car_brands').delete().eq('id', deleteId);
    setBrands(prev => prev.filter(b => b.id !== deleteId));
    toast.success('Brand deleted'); setDeleteId(null);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('car_brands').update({ is_active: !current }).eq('id', id);
    setBrands(prev => prev.map(b => b.id === id ? { ...b, is_active: !current } : b));
  };

  const filtered = brands.filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()));
  const setF = (k: keyof typeof EMPTY, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Car Brands</h1>
            <p className="text-sm text-muted-foreground">{brands.length} brands · {brands.filter(b => b.is_active).length} active</p>
          </div>
          <Button onClick={openAdd} className="h-9 gap-2"><Plus className="w-4 h-4" /> Add Brand</Button>
        </div>

        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search brands..." className="pl-9 h-9 text-sm" />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map(b => (
              <div key={b.id} className="flex items-center gap-3 border border-border rounded-xl p-3 hover:bg-muted/20 transition-colors">
                <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                  {b.logo_url ? <img src={b.logo_url} alt={b.name} className="w-7 h-7 object-contain" /> :
                    <span className="text-sm font-bold text-muted-foreground">{b.name.charAt(0)}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.name}</p>
                  {b.country_of_origin && <p className="text-xs text-muted-foreground truncate">{b.country_of_origin}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Switch checked={b.is_active !== false} onCheckedChange={() => toggleActive(b.id, b.is_active !== false)} />
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(b)}><Edit className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(b.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Brand' : 'Add Brand'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-xs mb-1.5 block">Name *</Label><Input value={form.name} onChange={e => setF('name', e.target.value)} className="h-9 text-sm" placeholder="e.g. Toyota" /></div>
            <div><Label className="text-xs mb-1.5 block">Logo URL</Label><Input value={form.logo_url as string} onChange={e => setF('logo_url', e.target.value)} className="h-9 text-sm" placeholder="https://..." /></div>
            <div><Label className="text-xs mb-1.5 block">Country of Origin</Label><Input value={form.country_of_origin as string} onChange={e => setF('country_of_origin', e.target.value)} className="h-9 text-sm" placeholder="Japan" /></div>
            <div className="flex items-center gap-3"><Switch checked={form.is_active as boolean} onCheckedChange={v => setF('is_active', v)} /><Label className="text-sm">Active</Label></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {editItem ? 'Update' : 'Add Brand'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <AlertDialogHeader><AlertDialogTitle>Delete Brand?</AlertDialogTitle><AlertDialogDescription>This brand will be removed from all filters.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={deleteBrand} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
