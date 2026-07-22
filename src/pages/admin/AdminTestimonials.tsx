import { useState, useEffect } from 'react';
import { Plus, Trash2, Star, Edit, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { supabase } from '@/db/supabase';
import type { Testimonial } from '@/types/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const EMPTY = { customer_name: '', customer_title: '', testimonial_text: '', rating: '5', is_active: true, avatar_url: '' };

export default function AdminTestimonials() {
  const { t } = useLanguage();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Testimonial | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    supabase.from('testimonials').select('*').order('display_order').then(({ data }) => {
      if (data) setItems(data as Testimonial[]);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditItem(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (t: Testimonial) => {
    setEditItem(t);
    setForm({ customer_name: t.customer_name || '', customer_title: t.customer_title || '', testimonial_text: t.testimonial_text || '', rating: String(t.rating || 5), is_active: t.is_active !== false, avatar_url: t.avatar_url || '' });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.customer_name || !form.testimonial_text) { toast.error('Name and testimonial are required'); return; }
    setSaving(true);
    const payload = { customer_name: form.customer_name, customer_title: form.customer_title || null, testimonial_text: form.testimonial_text, rating: parseInt(form.rating), is_active: form.is_active, avatar_url: form.avatar_url || null };
    try {
      if (editItem) {
        await supabase.from('testimonials').update(payload).eq('id', editItem.id);
        toast.success('Updated');
      } else {
        await supabase.from('testimonials').insert({ ...payload, display_order: items.length + 1 });
        toast.success('Added');
      }
      setDialogOpen(false); load();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const deleteItem = async () => {
    if (!deleteId) return;
    await supabase.from('testimonials').delete().eq('id', deleteId);
    setItems(prev => prev.filter(t => t.id !== deleteId));
    toast.success('Deleted'); setDeleteId(null);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('testimonials').update({ is_active: !current }).eq('id', id);
    setItems(prev => prev.map(t => t.id === id ? { ...t, is_active: !current } : t));
  };

  const setF = (k: keyof typeof EMPTY, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Testimonials</h1>
            <p className="text-sm text-muted-foreground">{items.length} testimonials</p>
          </div>
          <Button onClick={openAdd} className="h-9 gap-2"><Plus className="w-4 h-4" /> Add</Button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-xl">
            <p className="text-muted-foreground text-sm">No testimonials yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(t => (
              <div key={t.id} className={cn('flex items-start gap-4 p-4 border border-border rounded-xl hover:bg-muted/20 transition-colors', !t.is_active && 'opacity-50')}>
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {t.avatar_url ? <img src={t.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" /> : (t.customer_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{t.customer_name}</p>
                    {t.customer_title && <p className="text-xs text-muted-foreground">· {t.customer_title}</p>}
                    <div className="flex ml-1">
                      {Array.from({ length: t.rating || 5 }).map((_, i) => <Star key={i} className="w-3 h-3 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic">"{t.testimonial_text}"</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Switch checked={t.is_active !== false} onCheckedChange={() => toggleActive(t.id, t.is_active !== false)} />
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(t)}><Edit className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(t.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1.5 block">Name *</Label><Input value={form.customer_name} onChange={e => setF('customer_name', e.target.value)} className="h-9 text-sm" /></div>
              <div><Label className="text-xs mb-1.5 block">Title / Location</Label><Input value={form.customer_title} onChange={e => setF('customer_title', e.target.value)} className="h-9 text-sm" placeholder="Lahore" /></div>
            </div>
            <div><Label className="text-xs mb-1.5 block">Testimonial *</Label><Textarea value={form.testimonial_text} onChange={e => setF('testimonial_text', e.target.value)} className="text-sm resize-none min-h-[80px]" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1.5 block">Rating</Label>
                <Select value={form.rating} onValueChange={v => setF('rating', v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{[5,4,3,2,1].map(r => <SelectItem key={r} value={String(r)}>{r} Stars</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs mb-1.5 block">Avatar URL</Label><Input value={form.avatar_url} onChange={e => setF('avatar_url', e.target.value)} className="h-9 text-sm" placeholder="https://..." /></div>
            </div>
            <div className="flex items-center gap-3"><Switch checked={form.is_active as boolean} onCheckedChange={v => setF('is_active', v)} /><Label className="text-sm">Active</Label></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {editItem ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <AlertDialogHeader><AlertDialogTitle>Delete Testimonial?</AlertDialogTitle><AlertDialogDescription>This testimonial will be permanently removed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={deleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
