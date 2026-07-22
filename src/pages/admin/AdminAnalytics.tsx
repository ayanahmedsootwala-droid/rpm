import { useState, useEffect } from 'react';
import { Users, Car, Gavel, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { supabase } from '@/db/supabase';
import { formatCurrency } from '@/lib/utils-xyz';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell
} from 'recharts';

export default function AdminAnalytics() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState('6');
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ users: 0, cars: 0, auctions: 0, dealerships: 0, soldCars: 0 });
  const [monthlyUsers, setMonthlyUsers] = useState<{ month: string; users: number; cars: number }[]>([]);
  const [statusDist, setStatusDist] = useState<{ name: string; value: number }[]>([]);
  const [topCities, setTopCities] = useState<{ city: string; count: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - Number(period));
      const [u, c, a, d, sold, cars] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('cars').select('*', { count: 'exact', head: true }),
        supabase.from('auctions').select('*', { count: 'exact', head: true }),
        supabase.from('dealerships').select('*', { count: 'exact', head: true }),
        supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
        supabase.from('cars').select('status,city,created_at'),
      ]);
      setKpis({ users: u.count || 0, cars: c.count || 0, auctions: a.count || 0, dealerships: d.count || 0, soldCars: sold.count || 0 });
      // Status distribution
      const sm: Record<string, number> = {};
      (cars.data || []).forEach(c => { const s = c.status || 'unknown'; sm[s] = (sm[s] || 0) + 1; });
      setStatusDist(Object.entries(sm).map(([name, value]) => ({ name, value })));
      // Top cities
      const cm: Record<string, number> = {};
      (cars.data || []).forEach(c => { if (c.city) cm[c.city] = (cm[c.city] || 0) + 1; });
      setTopCities(Object.entries(cm).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([city, count]) => ({ city, count })));
      // Monthly signups (simulated from data)
      const months: Record<string, { month: string; users: number; cars: number }> = {};
      const now = new Date();
      for (let i = Number(period) - 1; i >= 0; i--) {
        const d = new Date(now); d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months[key] = { month: d.toLocaleString('default', { month: 'short', year: '2-digit' }), users: 0, cars: 0 };
      }
      (cars.data || []).forEach(c => {
        const d = new Date(c.created_at); const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (months[key]) months[key].cars++;
      });
      setMonthlyUsers(Object.values(months));
      setLoading(false);
    };
    load();
  }, [period]);

  const COLORS = ['hsl(var(--primary))', 'hsl(43,59%,44%)', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const kpiCards = [
    { label: 'Total Users', value: kpis.users.toLocaleString(), icon: Users, color: 'text-blue-600' },
    { label: 'Active Listings', value: kpis.cars.toLocaleString(), icon: Car, color: 'text-primary' },
    { label: 'Auctions', value: kpis.auctions.toLocaleString(), icon: Gavel, color: 'text-[hsl(var(--gold))]' },
    { label: 'Dealerships', value: kpis.dealerships.toLocaleString(), icon: TrendingUp, color: 'text-green-600' },
    { label: 'Cars Sold', value: kpis.soldCars.toLocaleString(), icon: Activity, color: 'text-orange-600' },
  ];

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold">Analytics</h1><p className="text-sm text-muted-foreground">Platform performance overview</p></div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 Months</SelectItem>
              <SelectItem value="6">Last 6 Months</SelectItem>
              <SelectItem value="12">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />) :
            kpiCards.map(k => (
              <Card key={k.label} className="h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div><p className={`text-xl font-bold ${k.color}`}>{k.value}</p><p className="text-xs text-muted-foreground mt-1">{k.label}</p></div>
                    <k.icon className={`w-5 h-5 ${k.color} opacity-60`} />
                  </div>
                </CardContent>
              </Card>
            ))
          }
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Listings over time */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Listings per Month</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-48 w-full" /> : (
                <div className="w-full min-w-0 overflow-hidden h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyUsers}>
                      <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--border))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--border))" />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="cars" stroke="hsl(var(--primary))" fill="url(#cg)" strokeWidth={2} dot={false} name="Listings" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status distribution */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Listing Status Distribution</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-48 w-full" /> : (
                <div className="w-full min-w-0 overflow-hidden h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                        {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} layout="horizontal" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top cities */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Top Cities by Listings</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-48 w-full" /> : (
                <div className="w-full min-w-0 overflow-hidden h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCities} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--border))" />
                      <YAxis dataKey="city" type="category" width={80} tick={{ fontSize: 11 }} stroke="hsl(var(--border))" />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Listings" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
