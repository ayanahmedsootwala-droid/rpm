import { useState, useEffect } from 'react';
import { Download, FileText, Table, BarChart2, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { supabase } from '@/db/supabase';
import { formatCurrency, formatDate } from '@/lib/utils-xyz';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReportStats {
  totalListings: number;
  activeListings: number;
  soldCars: number;
  totalUsers: number;
  totalDealerships: number;
  totalAuctions: number;
  totalBids: number;
  totalInquiries: number;
}

export default function AdminReports() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState('30');
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - Number(period));
      const [listings, active, sold, users, dealers, auctions, bids, inquiries] = await Promise.all([
        supabase.from('cars').select('*', { count: 'exact', head: true }).gte('created_at', cutoff.toISOString()),
        supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'sold').gte('updated_at', cutoff.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', cutoff.toISOString()),
        supabase.from('dealerships').select('*', { count: 'exact', head: true }),
        supabase.from('auctions').select('*', { count: 'exact', head: true }).gte('created_at', cutoff.toISOString()),
        supabase.from('bids').select('*', { count: 'exact', head: true }).gte('created_at', cutoff.toISOString()),
        supabase.from('inquiries').select('*', { count: 'exact', head: true }).gte('created_at', cutoff.toISOString()),
      ]);
      setStats({
        totalListings: listings.count || 0,
        activeListings: active.count || 0,
        soldCars: sold.count || 0,
        totalUsers: users.count || 0,
        totalDealerships: dealers.count || 0,
        totalAuctions: auctions.count || 0,
        totalBids: bids.count || 0,
        totalInquiries: inquiries.count || 0,
      });
      setLoading(false);
    };
    load();
  }, [period]);

  const exportCSV = async (type: string) => {
    setExporting(type);
    try {
      let data: Record<string, unknown>[] = [];
      let filename = '';

      if (type === 'listings') {
        const { data: rows } = await supabase.from('cars').select('id,title,brand_name,model_name,year,price,city,status,created_at').order('created_at', { ascending: false }).limit(1000);
        data = rows || [];
        filename = 'listings-export.csv';
      } else if (type === 'users') {
        const { data: rows } = await supabase.from('profiles').select('id,full_name,email,role,created_at').order('created_at', { ascending: false }).limit(1000);
        data = rows || [];
        filename = 'users-export.csv';
      } else if (type === 'inquiries') {
        const { data: rows } = await supabase.from('inquiries').select('id,name,email,phone,status,created_at').order('created_at', { ascending: false }).limit(1000);
        data = rows || [];
        filename = 'inquiries-export.csv';
      } else if (type === 'auctions') {
        const { data: rows } = await supabase.from('auctions').select('id,title,starting_price,current_price,status,start_time,end_time').order('created_at', { ascending: false }).limit(500);
        data = rows || [];
        filename = 'auctions-export.csv';
      }

      if (data.length === 0) { toast.info('No data to export'); return; }
      const headers = Object.keys(data[0]);
      const csv = [headers.join(','), ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
      toast.success(`${data.length} records exported`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(''); }
  };

  const statCards = stats ? [
    { label: 'New Listings', value: stats.totalListings, color: 'text-primary' },
    { label: 'Active Listings', value: stats.activeListings, color: 'text-blue-600' },
    { label: 'Cars Sold', value: stats.soldCars, color: 'text-green-600' },
    { label: 'New Users', value: stats.totalUsers, color: 'text-orange-600' },
    { label: 'Auctions Created', value: stats.totalAuctions, color: 'text-[hsl(var(--gold))]' },
    { label: 'Bids Placed', value: stats.totalBids, color: 'text-purple-600' },
    { label: 'Inquiries', value: stats.totalInquiries, color: 'text-cyan-600' },
    { label: 'Dealerships', value: stats.totalDealerships, color: 'text-rose-600' },
  ] : [];

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Reports</h1>
            <p className="text-sm text-muted-foreground">Platform summary and data exports</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />) :
            statCards.map(s => (
              <Card key={s.label} className="h-full">
                <CardContent className="p-4">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  <p className="text-xs text-muted-foreground">in last {period} days</p>
                </CardContent>
              </Card>
            ))
          }
        </div>

        {/* Export options */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Data Exports (CSV)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'listings', label: 'All Listings', desc: 'Car inventory with prices, status, and dates', icon: Table },
                { key: 'users', label: 'User List', desc: 'Registered users with roles and join dates', icon: FileText },
                { key: 'inquiries', label: 'Inquiries', desc: 'Customer inquiries and contact details', icon: BarChart2 },
                { key: 'auctions', label: 'Auctions', desc: 'Auction history with bids and outcomes', icon: Calendar },
              ].map(e => (
                <div key={e.key} className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/8 rounded-lg flex items-center justify-center shrink-0">
                      <e.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{e.label}</p>
                      <p className="text-xs text-muted-foreground">{e.desc}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => exportCSV(e.key)} disabled={exporting === e.key} className="h-8 gap-1.5 border border-border shrink-0">
                    {exporting === e.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    Export
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
