import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Check, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { supabase } from '@/db/supabase';
import { formatCurrency, formatDate } from '@/lib/utils-xyz';
import { toast } from 'sonner';
import type { Auction } from '@/types/types';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const PAGE_SIZE = 20;
const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  ended: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function AdminAuctions() {
  const { t } = useLanguage();
  const [items, setItems] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Auction | null>(null);
  const [form, setForm] = useState({ title: '', car_id: '', starting_price: '', bid_increment: '5000', reserve_price: '', start_time: '', end_time: '', status: 'scheduled' });
  const [saving, setSaving] = useState(false);
  const [cars, setCars] = useState<{ id: string; title: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('auctions').select('*', { count: 'exact' });
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    if (search) q = q.ilike('title', `%${search}%`);
    const { data, count } = await q.order('created_at', { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    setItems((data as Auction[]) || []);
    setTotal(count || 0);
    setLoading(false);
    setSelected(new Set());
  }, [search, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    supabase.from('cars').select('id,title,brand_name,model_name,year').eq('status', 'active').limit(100)
      .then(({ data }) => setCars((data || []).map(c => ({ id: c.id, title: c.title || `${c.year} ${c.brand_name} ${c.model_name}` }))));
  }, []);

  const openAdd = () => { setEditItem(null); setForm({ title: '', car_id: '', starting_price: '', bid_increment: '5000', reserve_price: '', start_time: '', end_time: '', status: 'scheduled' }); setDialogOpen(true); };
  const openEdit = (a: Auction) => {
    setEditItem(a);
    setForm({ title: a.title || '', car_id: a.car_id || '', starting_price: String(a.starting_price || ''), bid_increment: String(a.bid_increment || 5000), reserve_price: String(a.reserve_price || ''), start_time: a.start_time ? a.start_time.slice(0, 16) : '', end_time: a.end_time ? a.end_time.slice(0, 16) : '', status: a.status || 'scheduled' });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.title || !form.starting_price || !form.start_time || !form.end_time) { toast.error('Fill all required fields'); return; }
    setSaving(true);
    const payload = { title: form.title, car_id: form.car_id || null, starting_price: Number(form.starting_price), bid_increment: Number(form.bid_increment), reserve_price: form.reserve_price ? Number(form.reserve_price) : null, start_time: form.start_time, end_time: form.end_time, status: form.status };
    try {
      if (editItem) { await supabase.from('auctions').update(payload).eq('id', editItem.id); toast.success('Auction updated'); }
      else { await supabase.from('auctions').insert({ ...payload, current_price: Number(form.starting_price) }); toast.success('Auction created'); }
      setDialogOpen(false); load();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const deleteAuction = async () => {
    if (!deleteId) return;
    await supabase.from('auctions').delete().eq('id', deleteId);
    toast.success('Auction deleted'); setDeleteId(null); load();
  };

  const toggleSelect = (id: string) => { setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const setF = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold">Auctions</h1><p className="text-sm text-muted-foreground">{total} auctions</p></div>
          <Button onClick={openAdd} className="h-9 gap-2"><Plus className="w-4 h-4" /> Create Auction</Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search auctions..." className="pl-9 h-9 text-sm" />
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="w-10 px-4 py-3 text-left"><Checkbox checked={selected.size === items.length && items.length > 0} onCheckedChange={() => selected.size === items.length ? setSelected(new Set()) : setSelected(new Set(items.map(i => i.id)))} /></th>
                  <th className="text-left">Title</th>
                  <th className="text-left hidden md:table-cell">Starting</th>
                  <th className="text-left hidden lg:table-cell">Current</th>
                  <th className="text-left hidden md:table-cell">End Time</th>
                  <th className="text-left">Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border"><td colSpan={7} className="py-3 px-4"><Skeleton className="h-8 w-full" /></td></tr>
                )) : items.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">No auctions found</td></tr>
                ) : items.map(a => (
                  <tr key={a.id} className={cn('border-b border-border last:border-0 hover:bg-muted/20 transition-colors', selected.has(a.id) && 'bg-primary/5')}>
                    <td className="px-4 py-3"><Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggleSelect(a.id)} /></td>
                    <td><p className="text-sm font-medium truncate max-w-[200px]">{a.title}</p></td>
                    <td className="hidden md:table-cell"><p className="text-sm">{formatCurrency(a.starting_price)}</p></td>
                    <td className="hidden lg:table-cell"><p className="text-sm font-semibold">{formatCurrency(a.current_price ?? a.starting_price ?? 0)}</p></td>
                    <td className="hidden md:table-cell"><p className="text-xs text-muted-foreground">{formatDate(a.end_time)}</p></td>
                    <td><Badge className={cn('text-xs', STATUS_STYLES[a.status] || 'bg-muted text-muted-foreground')}>{a.status}</Badge></td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="w-7 h-7" asChild><Link to={`/auctions/${a.id}`} target="_blank"><Eye className="w-3.5 h-3.5" /></Link></Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(a)}><Edit className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(a.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Auction' : 'Create Auction'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><Label className="text-xs mb-1.5 block">Title *</Label><Input value={form.title} onChange={e => setF('title', e.target.value)} className="h-9 text-sm" /></div>
            <div className="col-span-2">
              <Label className="text-xs mb-1.5 block">Vehicle</Label>
              <Select value={form.car_id || 'none'} onValueChange={v => setF('car_id', v === 'none' ? '' : v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent><SelectItem value="none">No specific vehicle</SelectItem>{cars.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1.5 block">Starting Price (PKR) *</Label><Input type="number" value={form.starting_price} onChange={e => setF('starting_price', e.target.value)} className="h-9 text-sm" /></div>
            <div><Label className="text-xs mb-1.5 block">Bid Increment</Label><Input type="number" value={form.bid_increment} onChange={e => setF('bid_increment', e.target.value)} className="h-9 text-sm" /></div>
            <div><Label className="text-xs mb-1.5 block">Reserve Price</Label><Input type="number" value={form.reserve_price} onChange={e => setF('reserve_price', e.target.value)} className="h-9 text-sm" placeholder="Optional" /></div>
            <div>
              <Label className="text-xs mb-1.5 block">Status</Label>
              <Select value={form.status} onValueChange={v => setF('status', v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="scheduled">Scheduled</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="ended">Ended</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1.5 block">Start Time *</Label><Input type="datetime-local" value={form.start_time} onChange={e => setF('start_time', e.target.value)} className="h-9 text-sm" /></div>
            <div><Label className="text-xs mb-1.5 block">End Time *</Label><Input type="datetime-local" value={form.end_time} onChange={e => setF('end_time', e.target.value)} className="h-9 text-sm" /></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {editItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <AlertDialogHeader><AlertDialogTitle>Delete Auction?</AlertDialogTitle><AlertDialogDescription>All bid history will be removed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={deleteAuction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
