import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils-xyz';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Check, X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AdminWalletDeposits() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadDeposits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wallet_deposits')
      .select('*, profile:profiles(email, full_name, phone)')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Failed to load deposits');
    } else {
      setDeposits(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { loadDeposits(); }, []);

  const handleApprove = async (deposit: any) => {
    if (!window.confirm('Approve this deposit of ' + formatCurrency(deposit.amount) + '?')) return;
    setProcessing(deposit.id);
    
    try {
      // 1. Update deposit status
      const { error: dErr } = await supabase.from('wallet_deposits')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', deposit.id);
      if (dErr) throw dErr;

      // 2. Add to wallet_transactions
      const { error: tErr } = await supabase.from('wallet_transactions')
        .insert({
          user_id: deposit.user_id,
          type: 'deposit',
          amount: deposit.amount,
          description: 'Bank Deposit Approved',
          reference_id: deposit.id
        });
      if (tErr) throw tErr;

      // 3. Update wallet balance
      // First get current wallet from profiles
      const { data: wData } = await supabase.from('profiles').select('*').eq('id', deposit.user_id).single();
      if (wData) {
        await supabase.from('profiles').update({
          wallet_balance: Number(wData.wallet_balance || 0) + Number(deposit.amount),
          pending_balance: Math.max(0, Number(wData.pending_balance || 0) - Number(deposit.amount))
        }).eq('id', deposit.user_id);
      }

      toast.success('Deposit approved successfully');
      loadDeposits();
    } catch (e: any) {
      toast.error('Failed to approve deposit: ' + e.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (deposit: any) => {
    const reason = window.prompt('Enter rejection reason:');
    if (reason === null) return;
    
    setProcessing(deposit.id);
    try {
      const { error: dErr } = await supabase.from('wallet_deposits')
        .update({ status: 'rejected', rejection_reason: reason, updated_at: new Date().toISOString() })
        .eq('id', deposit.id);
      if (dErr) throw dErr;

      // Deduct from pending balance
      const { data: wData } = await supabase.from('profiles').select('*').eq('id', deposit.user_id).single();
      if (wData) {
        await supabase.from('profiles').update({
          pending_balance: Math.max(0, Number(wData.pending_balance || 0) - Number(deposit.amount))
        }).eq('id', deposit.user_id);
      }

      toast.success('Deposit rejected');
      loadDeposits();
    } catch (e: any) {
      toast.error('Failed to reject deposit: ' + e.message);
    } finally {
      setProcessing(null);
    }
  };

  const filtered = deposits.filter(d => 
    d.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    d.profile?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Wallet Deposits</h1>
            <p className="text-sm text-muted-foreground">Review and manage user deposit requests.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search user..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9 h-9" 
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="h-11 px-4 text-left font-medium text-muted-foreground whitespace-nowrap">Date</th>
                  <th className="h-11 px-4 text-left font-medium text-muted-foreground whitespace-nowrap">User</th>
                  <th className="h-11 px-4 text-left font-medium text-muted-foreground whitespace-nowrap">Amount</th>
                  <th className="h-11 px-4 text-left font-medium text-muted-foreground whitespace-nowrap">Status</th>
                  <th className="h-11 px-4 text-left font-medium text-muted-foreground whitespace-nowrap">Receipt</th>
                  <th className="h-11 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="p-4"><Skeleton className="h-12 w-full" /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No deposits found.</td></tr>
                ) : (
                  filtered.map(d => (
                    <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 whitespace-nowrap">{new Date(d.created_at).toLocaleString()}</td>
                      <td className="p-4">
                        <p className="font-medium text-foreground">{d.profile?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{d.profile?.email}</p>
                        {d.profile?.phone && <p className="text-xs text-muted-foreground">{d.profile.phone}</p>}
                      </td>
                      <td className="p-4 font-semibold whitespace-nowrap">{formatCurrency(d.amount)}</td>
                      <td className="p-4 whitespace-nowrap">
                        <Badge variant={d.status === 'approved' ? 'default' : d.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
                          {d.status}
                        </Badge>
                        {d.status === 'rejected' && d.rejection_reason && (
                          <p className="text-[10px] text-muted-foreground mt-1 max-w-[150px] truncate" title={d.rejection_reason}>
                            {d.rejection_reason}
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        <a href={d.receipt_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                          <ExternalLink className="w-3.5 h-3.5" /> View Receipt
                        </a>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        {d.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="h-8 border-success/30 text-success hover:bg-success hover:text-white" onClick={() => handleApprove(d)} disabled={processing === d.id}>
                              <Check className="w-3.5 h-3.5 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 border-destructive/30 text-destructive hover:bg-destructive hover:text-white" onClick={() => handleReject(d)} disabled={processing === d.id}>
                              <X className="w-3.5 h-3.5 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
