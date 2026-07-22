import { useState, useEffect, useRef } from 'react';
import { DealershipLayout } from '@/components/layouts/DealershipLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Send, MessageSquare, Phone, Mail, Clock, CheckCheck, Filter, RefreshCw } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  created_at: string;
  car_id: string | null;
  reply?: string | null;
  car?: { title?: string; brand_name?: string; model_name?: string; year?: number } | null;
}

export default function DealershipCommunication() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [dealershipId, setDealershipId] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Resolve dealership_id for current user
  useEffect(() => {
    if (!user) return;
    supabase
      .from('dealership_members')
      .select('dealership_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => { if (data?.dealership_id) setDealershipId(data.dealership_id); });
  }, [user]);

  async function loadInquiries() {
    if (!dealershipId) return;
    setRefreshing(true);
    const { data } = await supabase
      .from('inquiries')
      .select('*, car:cars(id,title,brand_name,model_name,year)')
      .eq('dealership_id', dealershipId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setInquiries(data as Inquiry[]);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { loadInquiries(); }, [dealershipId]);

  // realtime
  useEffect(() => {
    if (!dealershipId) return;
    const channelName = `dealership-inquiries-${dealershipId}-${Math.random().toString(36).substring(2, 10)}`;
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inquiries', filter: `dealership_id=eq.${dealershipId}` },
        () => loadInquiries()
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [dealershipId]);

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    setSending(true);
    const { error } = await supabase.from('inquiries').update({ reply: reply.trim(), status: 'replied', replied_at: new Date().toISOString() }).eq('id', selected.id);
    if (error) { toast.error('Failed to send reply'); setSending(false); return; }
    toast.success('Reply saved. Contact the customer directly via email or phone.');
    setInquiries(prev => prev.map(i => i.id === selected.id ? { ...i, reply: reply.trim(), status: 'replied' } : i));
    setSelected(prev => prev ? { ...prev, reply: reply.trim(), status: 'replied' } : null);
    setReply('');
    setSending(false);
  }

  async function markAsRead(id: string) {
    await supabase.from('inquiries').update({ status: 'read' }).eq('id', id).eq('status', 'new');
    setInquiries(prev => prev.map(i => i.id === id && i.status === 'new' ? { ...i, status: 'read' } : i));
  }

  const filtered = inquiries.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.email.toLowerCase().includes(search.toLowerCase()) || i.message.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: inquiries.length,
    new: inquiries.filter(i => i.status === 'new').length,
    replied: inquiries.filter(i => i.status === 'replied').length,
    read: inquiries.filter(i => i.status === 'read').length,
  };

  function statusBadge(status: string) {
    switch (status) {
      case 'new': return <Badge className="bg-blue-100 text-blue-700 text-xs">New</Badge>;
      case 'replied': return <Badge className="bg-success/10 text-success text-xs">Replied</Badge>;
      case 'read': return <Badge variant="secondary" className="text-xs">Read</Badge>;
      default: return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  }

  return (
    <DealershipLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold">Communication</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage customer inquiries and messages</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadInquiries} disabled={refreshing}>
            <RefreshCw className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')} />Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: '' },
            { label: 'New', value: stats.new, color: 'text-blue-600' },
            { label: 'Replied', value: stats.replied, color: 'text-success' },
            { label: 'Read', value: stats.read, color: 'text-muted-foreground' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className={cn('text-2xl font-bold mt-0.5', s.color)}>{s.value}</p></div>
                <MessageSquare className="w-5 h-5 text-muted-foreground opacity-50" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 min-h-[500px]">
          {/* Inbox */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="pl-8 h-8 text-sm" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[480px]">
              {loading ? (
                <div className="p-3 space-y-2">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-16 w-full"/>)}</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm"><MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />No inquiries found</div>
              ) : filtered.map(inquiry => (
                <button key={inquiry.id} onClick={() => { setSelected(inquiry); setReply(inquiry.reply || ''); markAsRead(inquiry.id); }}
                  className={cn('w-full text-left p-3 border-b border-border hover:bg-secondary/50 transition-colors', selected?.id === inquiry.id && 'bg-secondary/70')}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Avatar className="w-8 h-8 shrink-0 mt-0.5">
                        <AvatarFallback className="text-xs">{inquiry.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-medium truncate">{inquiry.name}</p>
                          {inquiry.status === 'new' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{inquiry.message}</p>
                        {inquiry.car && <p className="text-xs text-gold truncate">{inquiry.car.brand_name} {inquiry.car.model_name}</p>}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {statusBadge(inquiry.status)}
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(inquiry.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Detail / Reply */}
          {selected ? (
            <Card className="flex flex-col">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{selected.name}</CardTitle>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{selected.email}</span>
                      {selected.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{selected.phone}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(selected.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  {statusBadge(selected.status)}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4 pt-4">
                {selected.car && (
                  <div className="p-3 bg-secondary/50 rounded-lg text-sm">
                    <p className="text-xs text-muted-foreground mb-1">Regarding vehicle:</p>
                    <p className="font-medium">{selected.car.brand_name} {selected.car.model_name} {selected.car.year}</p>
                  </div>
                )}
                <div className="p-4 bg-background border border-border rounded-xl">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">Customer Message</p>
                  <p className="text-sm leading-relaxed">{selected.message}</p>
                </div>

                {selected.reply && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2 flex items-center gap-1.5"><CheckCheck className="w-3.5 h-3.5 text-success" />Your Reply</p>
                    <p className="text-sm leading-relaxed">{selected.reply}</p>
                  </div>
                )}

                <div className="mt-auto">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">{selected.reply ? 'Update Reply' : 'Reply'}</p>
                  <Textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Type your reply…" rows={4} className="text-sm resize-none" />
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-muted-foreground">Reply is saved internally. Contact customer via email/phone directly.</p>
                    <Button size="sm" onClick={sendReply} disabled={sending || !reply.trim()} className="gap-2">
                      <Send className="w-3.5 h-3.5" />{sending ? 'Saving…' : 'Save Reply'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center">
              <div className="text-center p-10 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Select an inquiry</p>
                <p className="text-xs mt-1">Choose a message from the inbox to view and reply</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DealershipLayout>
  );
}
