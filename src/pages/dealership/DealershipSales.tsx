import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Car, DollarSign, Calendar, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DealershipLayout } from '@/components/layouts/DealershipLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { formatCurrency, formatDate } from '@/lib/utils-xyz';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { Car as CarType } from '@/types/types';
import { useLanguage } from '@/contexts/LanguageContext';

export default function DealershipSales() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [soldCars, setSoldCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [dealershipId, setDealershipId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('dealership_members').select('dealership_id').eq('user_id', user.id).eq('is_active', true).maybeSingle()
      .then(({ data }) => { if (data) setDealershipId(data.dealership_id); });
  }, [user]);

  const fetchSales = useCallback(async () => {
    if (!dealershipId) return;
    setLoading(true);
    let q = supabase.from('cars').select('*').eq('dealership_id', dealershipId).eq('status', 'sold');
    if (period !== 'all') {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - Number(period));
      q = q.gte('updated_at', cutoff.toISOString());
    }
    const { data } = await q.order('updated_at', { ascending: false });
    setSoldCars((data as CarType[]) || []);
    setLoading(false);
  }, [dealershipId, period]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const totalRevenue = soldCars.reduce((sum, c) => sum + (c.price || 0), 0);
  const avgPrice = soldCars.length > 0 ? totalRevenue / soldCars.length : 0;

  // Monthly sales chart data
  const monthlyData = (() => {
    const months: Record<string, { month: string; sales: number; revenue: number }> = {};
    soldCars.forEach(car => {
      const d = new Date(car.updated_at || car.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!months[key]) months[key] = { month: label, sales: 0, revenue: 0 };
      months[key].sales += 1;
      months[key].revenue += car.price || 0;
    });
    return Object.values(months).slice(-6).reverse();
  })();

  const filtered = soldCars.filter(c =>
    !search || `${c.title} ${c.brand_name} ${c.model_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DealershipLayout>
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Sales</h1>
            <p className="text-sm text-muted-foreground">{soldCars.length} vehicles sold</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-9 text-sm w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="1">Last Month</SelectItem>
              <SelectItem value="3">Last 3 Months</SelectItem>
              <SelectItem value="6">Last 6 Months</SelectItem>
              <SelectItem value="12">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign },
            { label: 'Cars Sold', value: soldCars.length.toString(), icon: Car },
            { label: 'Average Price', value: formatCurrency(avgPrice), icon: TrendingUp },
          ].map(s => (
            <Card key={s.label} className="h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/8 rounded-lg flex items-center justify-center shrink-0">
                  <s.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Chart */}
        {monthlyData.length > 0 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Monthly Revenue</CardTitle></CardHeader>
            <CardContent>
              <div className="w-full min-w-0 overflow-hidden h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--border))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--border))" tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), 'Revenue']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#salesGradient)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sales list */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sold vehicles..." className="pl-9 h-9 text-sm" />
        </div>

        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left">Vehicle</th>
                  <th className="text-left">Sale Price</th>
                  <th className="text-left hidden md:table-cell">Date Sold</th>
                  <th className="text-left hidden lg:table-cell">Year</th>
                  <th className="text-left hidden md:table-cell">Mileage</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border"><td colSpan={5} className="py-3 px-4"><Skeleton className="h-8 w-full" /></td></tr>
                )) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">No sales records found</td></tr>
                ) : filtered.map(car => (
                  <tr key={car.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                          {car.images?.[0] && <img src={car.images[0]} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{car.brand_name} {car.model_name}</p>
                          <p className="text-xs text-muted-foreground">{car.variant_name}</p>
                        </div>
                      </div>
                    </td>
                    <td><p className="text-sm font-semibold text-green-600">{formatCurrency(car.price)}</p></td>
                    <td className="hidden md:table-cell"><p className="text-xs text-muted-foreground">{formatDate(car.updated_at || car.created_at)}</p></td>
                    <td className="hidden lg:table-cell"><p className="text-sm">{car.year}</p></td>
                    <td className="hidden md:table-cell"><p className="text-sm text-muted-foreground">{car.mileage?.toLocaleString()} km</p></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DealershipLayout>
  );
}
