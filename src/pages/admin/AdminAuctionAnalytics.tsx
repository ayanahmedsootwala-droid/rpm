import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Gavel, DollarSign, Users, Clock, Award, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { formatCurrency } from '@/lib/utils-xyz';
import type { Auction, Bid } from '@/types/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface AuctionStats {
  totalAuctions: number;
  activeAuctions: number;
  totalBids: number;
  totalRevenue: number;
  avgBidCount: number;
  highestBid: number;
  conversionRate: number;
}

const CHART_COLORS = ['hsl(38,80%,45%)', 'hsl(220,60%,52%)', 'hsl(142,55%,42%)', 'hsl(0,65%,52%)', 'hsl(265,55%,50%)'];

export default function AdminAuctionAnalytics() {
  const { t } = useLanguage();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [stats, setStats] = useState<AuctionStats>({ totalAuctions: 0, activeAuctions: 0, totalBids: 0, totalRevenue: 0, avgBidCount: 0, highestBid: 0, conversionRate: 0 });
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [period]);

  async function loadData() {
    setLoading(true);
    const since = new Date(Date.now() - parseInt(period) * 24 * 3600 * 1000).toISOString();
    const [{ data: aData }, { data: bData }] = await Promise.all([
      supabase.from('auctions').select('*, car:cars(id,title,brand_name,model_name,year,images)').gte('created_at', since).order('created_at', { ascending: false }),
      supabase.from('bids').select('*').gte('created_at', since).order('created_at', { ascending: true }),
    ]);
    const aList = (aData as Auction[]) || [];
    const bList = (bData as Bid[]) || [];
    setAuctions(aList);
    setBids(bList);

    const active = aList.filter(a => a.status === 'active').length;
    const sold = aList.filter(a => a.status === 'sold');
    const revenue = sold.reduce((s, a) => s + (a.current_bid || 0), 0);
    const highestBid = bList.reduce((m, b) => Math.max(m, b.amount), 0);
    setStats({
      totalAuctions: aList.length, activeAuctions: active,
      totalBids: bList.length, totalRevenue: revenue,
      avgBidCount: aList.length > 0 ? Math.round(bList.length / aList.length) : 0,
      highestBid, conversionRate: aList.length > 0 ? Math.round((sold.length / aList.length) * 100) : 0,
    });
    setLoading(false);
  }

  // Bids over time (last N days)
  const bidsOverTime = (() => {
    const days = parseInt(period);
    const map: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      map[d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = 0;
    }
    bids.forEach(b => {
      const key = new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (key in map) map[key]++;
    });
    return Object.entries(map).map(([date, count]) => ({ date, bids: count }));
  })();

  // Auction status breakdown
  const statusData = [
    { name: 'Active', value: auctions.filter(a => a.status === 'active').length },
    { name: 'Sold', value: auctions.filter(a => a.status === 'sold').length },
    { name: 'Ended', value: auctions.filter(a => a.status === 'ended').length },
    { name: 'Scheduled', value: auctions.filter(a => a.status === 'scheduled').length },
  ].filter(d => d.value > 0);

  // Top auctions by bid count
  const topAuctions = [...auctions]
    .map(a => ({ ...a, bidCount: bids.filter(b => b.auction_id === a.id).length }))
    .sort((a, b) => b.bidCount - a.bidCount)
    .slice(0, 5);

  const StatCard = ({ icon: Icon, label, value, sub, up }: { icon: React.ElementType; label: string; value: string; sub?: string; up?: boolean }) => (
    <Card>
      <CardContent className="p-5 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
          {sub && <p className={`text-xs mt-0.5 flex items-center gap-0.5 ${up ? 'text-success' : 'text-muted-foreground'}`}>{up !== undefined && (up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
          <Icon className="w-4.5 h-4.5 text-gold" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Auction Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Performance insights for all auction activity</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Gavel} label="Total Auctions" value={stats.totalAuctions.toString()} sub={`${stats.activeAuctions} active`} up />
          <StatCard icon={TrendingUp} label="Total Bids" value={stats.totalBids.toString()} sub={`Avg ${stats.avgBidCount}/auction`} up />
          <StatCard icon={DollarSign} label="Revenue" value={formatCurrency(stats.totalRevenue)} sub="from sold auctions" up />
          <StatCard icon={Award} label="Conversion Rate" value={`${stats.conversionRate}%`} sub="auctions sold" up={stats.conversionRate > 50} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bids over time */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Bids Over Time</CardTitle>
              <CardDescription>Daily bid activity for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-56 bg-muted animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={bidsOverTime}>
                    <defs>
                      <linearGradient id="bidGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="bids" stroke={CHART_COLORS[0]} strokeWidth={2} fill="url(#bidGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Status breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Auction Status</CardTitle>
              <CardDescription>Distribution by current status</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-56 bg-muted animate-pulse rounded-lg" />
              ) : statusData.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">No auction data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="45%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top auctions table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Auctions by Bid Activity</CardTitle>
            <CardDescription>Most competitive auctions in the selected period</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pl-4 text-left py-2.5">#</th>
                    <th className="px-2 text-left py-2.5">Auction</th>
                    <th className="px-2 text-right py-2.5">Starting Bid</th>
                    <th className="px-2 text-right py-2.5">Current Bid</th>
                    <th className="px-2 text-right py-2.5">Total Bids</th>
                    <th className="px-2 text-right py-2.5 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({length:5}).map((_,i) => (
                      <tr key={i} className="border-b border-border">
                        {Array.from({length:6}).map((_,j) => <td key={j} className="px-2 py-3"><div className="h-3 bg-muted rounded animate-pulse" /></td>)}
                      </tr>
                    ))
                  ) : topAuctions.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">No auction data for selected period</td></tr>
                  ) : topAuctions.map((a, i) => (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="pl-4 py-3 text-muted-foreground text-xs">{i + 1}</td>
                      <td className="px-2 py-3">
                        <p className="font-medium truncate max-w-[220px]">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(a.end_time).toLocaleDateString()}</p>
                      </td>
                      <td className="px-2 py-3 text-right tabular-nums text-sm">{formatCurrency(a.starting_bid)}</td>
                      <td className="px-2 py-3 text-right tabular-nums text-sm font-semibold text-gold">{formatCurrency(a.current_bid || a.starting_bid)}</td>
                      <td className="px-2 py-3 text-right tabular-nums">{(a as Auction & { bidCount: number }).bidCount}</td>
                      <td className="px-2 py-3 pr-4 text-right">
                        <Badge className={`badge-${a.status} text-xs`}>{a.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
