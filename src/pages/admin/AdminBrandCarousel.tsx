import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import type { BrandCarousel } from '@/types/types';
import { useLanguage } from '@/contexts/LanguageContext';

type FormValues = { brand_name: string; logo_url: string; link_url: string; display_order: string; };

export default function AdminBrandCarousel() {
  const { t } = useLanguage();
  const [items, setItems] = useState<BrandCarousel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; item?: BrandCarousel }>({ open: false });
  const form = useForm<FormValues>({ defaultValues: { brand_name: '', logo_url: '', link_url: '', display_order: '0' } });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('brand_carousel').select('*').order('display_order');
    if (data) setItems(data as BrandCarousel[]);
    setLoading(false);
  }

  async function save(values: FormValues) {
    const payload = {
      brand_name: values.brand_name,
      logo_url: values.logo_url || null,
      link_url: values.link_url || null,
      display_order: parseInt(values.display_order, 10) || 0,
    };
    if (dialog.item) {
      const { error } = await supabase.from('brand_carousel').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', dialog.item.id);
      if (error) { toast.error('Failed to update'); return; }
      toast.success('Brand updated');
    } else {
      const { error } = await supabase.from('brand_carousel').insert({ ...payload, is_active: true });
      if (error) { toast.error('Failed to add'); return; }
      toast.success('Brand added to carousel');
    }
    setDialog({ open: false }); load();
  }

  async function remove(id: string) {
    if (!confirm('Remove this brand from the carousel?')) return;
    await supabase.from('brand_carousel').delete().eq('id', id);
    toast.success('Removed'); load();
  }

  async function toggleActive(item: BrandCarousel) {
    await supabase.from('brand_carousel').update({ is_active: !item.is_active, updated_at: new Date().toISOString() }).eq('id', item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
  }

  async function moveUp(idx: number) {
    if (idx === 0) return;
    const arr = [...items];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    const updates = arr.map((item, i) => supabase.from('brand_carousel').update({ display_order: i, updated_at: new Date().toISOString() }).eq('id', item.id));
    await Promise.all(updates);
    setItems(arr.map((item, i) => ({ ...item, display_order: i })));
    toast.success('Order updated');
  }

  async function moveDown(idx: number) {
    if (idx >= items.length - 1) return;
    const arr = [...items];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    const updates = arr.map((item, i) => supabase.from('brand_carousel').update({ display_order: i, updated_at: new Date().toISOString() }).eq('id', item.id));
    await Promise.all(updates);
    setItems(arr.map((item, i) => ({ ...item, display_order: i })));
    toast.success('Order updated');
  }

  function openAdd() {
    form.reset({ brand_name: '', logo_url: '', link_url: '', display_order: String(items.length) });
    setDialog({ open: true });
  }

  function openEdit(item: BrandCarousel) {
    form.reset({ brand_name: item.brand_name, logo_url: item.logo_url || '', link_url: item.link_url || '', display_order: String(item.display_order) });
    setDialog({ open: true, item });
  }

  const activeCount = items.filter(i => i.is_active).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Brand Carousel</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage the brand logo carousel shown on the homepage</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{activeCount} active · {items.length} total</Badge>
            <Button size="sm" onClick={openAdd}><Plus className="w-4 h-4 mr-1" /> Add Brand</Button>
          </div>
        </div>

        {/* Live preview */}
        {items.filter(i => i.is_active).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Live Preview</CardTitle>
              <CardDescription>How the carousel appears on the homepage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 overflow-x-auto pb-2 px-1">
                {items.filter(i => i.is_active).map(item => (
                  <div key={item.id} className="flex flex-col items-center gap-2 shrink-0">
                    {item.logo_url ? (
                      <div className="w-16 h-10 flex items-center justify-center">
                        <img src={item.logo_url} alt={item.brand_name} className="max-w-full max-h-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    ) : (
                      <div className="w-16 h-10 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {item.brand_name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">{item.brand_name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Items table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <GripVertical className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No brands in the carousel yet.</p>
                <Button className="mt-4" size="sm" onClick={openAdd}><Plus className="w-4 h-4 mr-1" /> Add First Brand</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pl-4 py-2.5 text-left w-10">Order</th>
                      <th className="px-2 py-2.5 text-left">Brand</th>
                      <th className="px-2 py-2.5 text-left">Logo</th>
                      <th className="px-2 py-2.5 text-left">Link</th>
                      <th className="px-2 py-2.5 text-center">Visible</th>
                      <th className="px-2 py-2.5 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={item.id} className="border-b border-border last:border-0">
                        <td className="pl-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <button onClick={() => moveUp(idx)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 leading-none">▲</button>
                            <button onClick={() => moveDown(idx)} disabled={idx === items.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 leading-none">▼</button>
                          </div>
                        </td>
                        <td className="px-2 py-3 font-medium">{item.brand_name}</td>
                        <td className="px-2 py-3">
                          {item.logo_url ? (
                            <img src={item.logo_url} alt={item.brand_name} className="h-7 w-auto max-w-[80px] object-contain" onError={e => { (e.target as HTMLImageElement).replaceWith(Object.assign(document.createElement('span'), { textContent: 'No image', className: 'text-xs text-muted-foreground' })); }} />
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No logo</span>
                          )}
                        </td>
                        <td className="px-2 py-3">
                          {item.link_url ? (
                            <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gold flex items-center gap-1 hover:underline">
                              <ExternalLink className="w-3 h-3" />{item.link_url.replace(/^https?:\/\//, '').slice(0, 28)}{item.link_url.length > 28 ? '…' : ''}
                            </a>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="px-2 py-3 text-center">
                          <Switch checked={item.is_active} onCheckedChange={() => toggleActive(item)} />
                        </td>
                        <td className="px-2 py-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialog.open} onOpenChange={o => setDialog({ open: o })}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader><DialogTitle>{dialog.item ? 'Edit Brand' : 'Add Brand to Carousel'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(save)} className="space-y-4">
              <FormField control={form.control} name="brand_name" rules={{ required: 'Brand name is required' }} render={({ field }) => (
                <FormItem><FormLabel>Brand Name</FormLabel><FormControl><Input {...field} placeholder="Toyota" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="logo_url" render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl><Input {...field} placeholder="https://…/logo.png" /></FormControl>
                  {field.value && <img src={field.value} alt="preview" className="h-8 mt-1 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="link_url" render={({ field }) => (
                <FormItem><FormLabel>Link URL (optional)</FormLabel><FormControl><Input {...field} placeholder="https://example.com/brand" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="display_order" render={({ field }) => (
                <FormItem><FormLabel>Display Order</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setDialog({ open: false })}>Cancel</Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
