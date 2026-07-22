import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Mail, Phone, Search, Trash2, ChevronRight, Reply } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DealershipLayout } from '@/components/layouts/DealershipLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { formatDate } from '@/lib/utils-xyz';
import type { Inquiry } from '@/types/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  closed: 'bg-muted text-muted-foreground',
  converted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export default function DealershipLeads() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dealershipId, setDealershipId] = useState<string | null>(null);
  const [viewInquiry, setViewInquiry] = useState<Inquiry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('dealership_members').select('dealership_id').eq('user_id', user.id).eq('is_active', true).maybeSingle()
      .then(({ data }) => { if (data) setDealershipId(data.dealership_id); });
  }, [user]);

  const fetchInquiries = useCallback(async () => {
    if (!dealershipId) return;
    setLoading(true);
    let q = supabase.from('inquiries')
      .select('*, car:cars(id,title,brand_name,model_name,year)')
      .eq('dealership_id', dealershipId);
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    const { data } = await q.order('created_at', { ascending: false }).limit(50);
    setInquiries((data as Inquiry[]) || []);
    setLoading(false);
  }, [dealershipId, statusFilter, search]);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('inquiries').update({ status }).eq('id', id);
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, status: status as Inquiry['status'] } : i));
    if (viewInquiry?.id === id) setViewInquiry(prev => prev ? { ...prev, status: status as Inquiry['status'] } : null);
    toast.success('Status updated');
  };

  const deleteInquiry = async () => {
    if (!deleteId) return;
    await supabase.from('inquiries').delete().eq('id', deleteId);
    setInquiries(prev => prev.filter(i => i.id !== deleteId));
    toast.success('Inquiry deleted');
    setDeleteId(null);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !viewInquiry) return;
    setReplying(true);
    try {
      // Store reply as a note on the inquiry
      await supabase.from('inquiries').update({ notes: replyText, status: 'in_progress' }).eq('id', viewInquiry.id);
      toast.success('Reply saved. Contact the customer directly via email or phone.');
      setReplyText('');
      setViewInquiry(prev => prev ? { ...prev, notes: replyText, status: 'in_progress' as Inquiry['status'] } : null);
      fetchInquiries();
    } catch { toast.error('Failed to save reply'); }
    finally { setReplying(false); }
  };

  const stats = {
    total: inquiries.length,
    new: inquiries.filter(i => i.status === 'new').length,
    in_progress: inquiries.filter(i => i.status === 'in_progress').length,
    converted: inquiries.filter(i => i.status === 'converted').length,
  };

  return (
    <DealershipLayout>
      <div className="p-4 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Leads & Inquiries</h1>
            <p className="text-sm text-muted-foreground">{stats.total} total · {stats.new} new</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: '' },
            { label: 'New', value: stats.new, color: 'text-blue-600' },
            { label: 'In Progress', value: stats.in_progress, color: 'text-yellow-600' },
            { label: 'Converted', value: stats.converted, color: 'text-green-600' },
          ].map(s => (
            <div key={s.label} className="p-4 border border-border rounded-xl">
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="pl-9 h-9 text-sm" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-sm w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left">Customer</th>
                  <th className="text-left hidden md:table-cell">Contact</th>
                  <th className="text-left hidden lg:table-cell">Vehicle</th>
                  <th className="text-left hidden md:table-cell">Date</th>
                  <th className="text-left">Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border"><td colSpan={6} className="py-3 px-4"><Skeleton className="h-8 w-full" /></td></tr>
                )) : inquiries.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">No inquiries found</td></tr>
                ) : inquiries.map(inq => (
                  <tr key={inq.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td>
                      <p className="text-sm font-medium">{inq.name}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{inq.email}</p>
                    </td>
                    <td className="hidden md:table-cell">
                      <div className="space-y-0.5">
                        <p className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> {inq.email}</p>
                        {inq.phone && <p className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> {inq.phone}</p>}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell">
                      <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                        {(inq as Inquiry & { car?: { title?: string; brand_name?: string; model_name?: string } }).car?.title || 'General inquiry'}
                      </p>
                    </td>
                    <td className="hidden md:table-cell"><p className="text-xs text-muted-foreground">{formatDate(inq.created_at)}</p></td>
                    <td>
                      <Select value={inq.status || 'new'} onValueChange={v => updateStatus(inq.id, v)}>
                        <SelectTrigger className="h-7 text-xs w-32 border-0 p-0">
                          <Badge className={cn('text-xs cursor-pointer', STATUS_STYLES[inq.status || 'new'])}>{(inq.status || 'new').replace('_', ' ')}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setViewInquiry(inq); setReplyText(''); }}>
                          <MessageSquare className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(inq.id)}>
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

      {/* View/Reply dialog */}
      <Dialog open={!!viewInquiry} onOpenChange={open => !open && setViewInquiry(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>Inquiry from {viewInquiry?.name}</DialogTitle></DialogHeader>
          {viewInquiry && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{viewInquiry.email}</p></div>
                <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{viewInquiry.phone || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{formatDate(viewInquiry.created_at)}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={cn('text-xs', STATUS_STYLES[viewInquiry.status || 'new'])}>{(viewInquiry.status || 'new').replace('_', ' ')}</Badge>
                </div>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Message</p>
                <p className="text-sm">{viewInquiry.message}</p>
              </div>
              {viewInquiry.notes && (
                <div className="p-3 bg-[hsl(var(--gold)/0.06)] border border-[hsl(var(--gold)/0.2)] rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Your Notes</p>
                  <p className="text-sm">{viewInquiry.notes}</p>
                </div>
              )}
              <div>
                <Label className="text-xs mb-1.5 block">Add Notes / Reply</Label>
                <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write notes or reply..." className="text-sm min-h-[80px] resize-none" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setViewInquiry(null)}>Close</Button>
            <Button size="sm" onClick={sendReply} disabled={replying || !replyText.trim()}>
              <Reply className="w-3.5 h-3.5 mr-1" /> Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inquiry?</AlertDialogTitle>
            <AlertDialogDescription>This inquiry will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteInquiry} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DealershipLayout>
  );
}
