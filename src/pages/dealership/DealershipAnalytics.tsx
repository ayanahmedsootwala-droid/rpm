import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Car, MessageSquare, Eye, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { DealershipLayout } from '@/components/layouts/DealershipLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { formatCurrency } from '@/lib/utils-xyz';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function DealershipAnalytics() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [dealershipId, setDealershipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('6');
  const [stats, setStats] = useState({ active: 0, sold: 0, leads: 0, revenue: 0 });
  const [inventoryByType, setInventoryByType] = useState<{ name: string; value: number }[]>([]);
  const [monthlyActivity, setMonthlyActivity] = useState<{ month: string; listed: number; sold: number; leads: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('dealership_members').select('dealership_id').eq('user_id', user.id).eq('is_active', true).maybeSingle()
      .then(({ data }) => { if (data) setDealershipId(data.dealership_id); });
  }, [user]);

  const fetchAnalytics = useCallback(async () => {
    if (!dealershipId) return;
    setLoading(true);
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - Number(period));

    const [activeRes, soldRes, leadsRes, allCarsRes] = await Promise.all([
      supabase.from('cars').select('*', { count: 'exact', head: true }).eq('dealership_id', dealershipId).eq('status', 'active'),
      supabase.from('cars').select('id,price,updated_at').eq('dealership_id', dealershipId).eq('status', 'sold'),
      supabase.from('inquiries').select('*', { count: 'exact', head: true }).gte('created_at', cutoff.toISOString()),
      supabase.from('cars').select('body_type,status,price,created_at').eq('dealership_id', dealershipId),
    ]);

    const soldCars = soldRes.data || [];
    const revenue = soldCars.reduce((sum, c) => sum + (c.price || 0), 0);
    setStats({ active: activeRes.count || 0, sold: soldCars.length, leads: leadsRes.count || 0, revenue });

    // Body type distribution
    const typeMap: Record<string, number> = {};
    (allCarsRes.data || []).forEach(c => {
      const t = c.body_type || 'Other';
      typeMap[t] = (typeMap[t] || 0) + 1;
    });
    setInventoryByType(Object.entries(typeMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6));

    // Monthly activity
    const months: Record<string, { month: string; listed: number; sold: number; leads: number }> = {};
    const now = new Date();
    for (let i = Number(period) - 1; i >= 0; i--) {
      const d = new Date(now); d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = { month: d.toLocaleString('default', { month: 'short' }), listed: 0, sold: 0, leads: 0 };
    }
    (allCarsRes.data || []).forEach(c => {
      const d = new Date(c.created_at); const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (months[key]) { if (c.status === 'sold') months[key].sold++; else months[key].listed++; }
    });
    setMonthlyActivity(Object.values(months));
    setLoading(false);
  }, [dealershipId, period]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const COLORS = ['hsl(var(--primary))', 'hsl(43,59%,44%)', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--muted-foreground))'];

  return (
    <DealershipLayout>
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Analytics</h1>
            <p className="text-sm text-muted-foreground">Dealership performance overview</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 Months</SelectItem>
              <SelectItem value="6">Last 6 Months</SelectItem>
              <SelectItem value="12">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) :
            [
              { label: 'Active Listings', value: stats.active.toString(), icon: Car, color: 'text-blue-600' },
              { label: 'Cars Sold', value: stats.sold.toString(), icon: TrendingUp, color: 'text-green-600' },
              { label: 'Leads Received', value: stats.leads.toString(), icon: MessageSquare, color: 'text-orange-600' },
              { label: 'Revenue', value: formatCurrency(stats.revenue), icon: BarChart3, color: 'text-[hsl(var(--gold))]' },
            ].map(s => (
              <Card key={s.label} className="h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                    </div>
                    <s.icon className={`w-5 h-5 ${s.color} opacity-60`} />
                  </div>
                </CardContent>
              </Card>
            ))
          }
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Monthly bar chart */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Monthly Activity</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-48 w-full" /> : (
                <div className="w-full min-w-0 overflow-hidden h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyActivity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--border))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--border))" />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} layout="horizontal" />
                      <Bar dataKey="listed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Listed" />
                      <Bar dataKey="sold" fill="hsl(43,59%,44%)" radius={[4, 4, 0, 0]} name="Sold" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inventory by type */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Inventory by Body Type</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-48 w-full" /> : inventoryByType.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No inventory data</p>
              ) : (
                <div className="w-full min-w-0 overflow-hidden h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={inventoryByType} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                        {inventoryByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} layout="horizontal" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DealershipLayout>
  );
}
