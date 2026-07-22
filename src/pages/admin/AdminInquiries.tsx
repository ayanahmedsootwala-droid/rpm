import { useState, useEffect } from 'react';
import { Mail, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { supabase } from '@/db/supabase';
import { formatDate, getStatusColor } from '@/lib/utils-xyz';
import type { Inquiry } from '@/types/types';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminInquiries() {
  const { t } = useLanguage();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchInquiries = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = supabase.from('inquiries').select('*, car:cars(id,title,brand_name,model_name)').order('created_at', { ascending: false }).limit(100);
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) console.error('Error fetching inquiries:', error);
      if (data) setInquiries(data as Inquiry[]);
      setLoading(false);
    };
    fetchInquiries();
  }, [statusFilter]);

  const update = async (id: string, status: string) => {
    await supabase.from('inquiries').update({ status }).eq('id', id);
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, status: status as Inquiry['status'] } : i));
    toast.success('Updated');
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Inquiries</h1>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="responded">Responded</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {loading ? <div className="animate-pulse bg-muted rounded h-32" /> :
          inquiries.length === 0 ? <p className="text-muted-foreground text-center py-12">No inquiries.</p> :
          <div className="space-y-3">
            {inquiries.map(inq => (
              <div key={inq.id} className="bg-card border border-border rounded-md p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-medium text-sm">{inq.name}</p>
                      <Badge className={`text-xs capitalize ${getStatusColor(inq.status)}`}>{inq.status}</Badge>
                      {inq.car && <span className="text-xs text-muted-foreground">re: {(inq.car as unknown as Record<string,unknown>)?.title as string || 'Vehicle'}</span>}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
                      {inq.email && <a href={`mailto:${inq.email}`} className="flex items-center gap-1 hover:text-foreground"><Mail className="w-3 h-3" />{inq.email}</a>}
                      {inq.phone && <a href={`tel:${inq.phone}`} className="flex items-center gap-1 hover:text-foreground"><Phone className="w-3 h-3" />{inq.phone}</a>}
                    </div>
                    <p className="text-sm text-foreground/80">{inq.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(inq.created_at)}</p>
                  </div>
                  <Select value={inq.status} onValueChange={v => update(inq.id, v)}>
                    <SelectTrigger className="h-7 text-xs w-32 shrink-0"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="responded">Responded</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        }
      </div>
    </AdminLayout>
  );
}
