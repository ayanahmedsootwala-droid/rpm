import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Car, Users, Building2, Gavel, AlertCircle, MessageSquare,
  ChevronRight, TrendingUp, TrendingDown, Plus, Eye, CheckCircle2,
  Clock, ShoppingBag, Activity, BarChart2, ArrowUpRight, Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { supabase } from '@/db/supabase';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils-xyz';
import type { Car as CarType } from '@/types/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { cn } from '@/lib/utils';

interface AdminStats {
  totalCars: number; activeCars: number; pendingCars: number; soldCars: number;
  totalUsers: number; totalDealerships: number; totalAuctions: number; activeAuctions: number;
  totalInquiries: number; newInquiries: number;
}

interface ActivityItem {
  id: string; type: 'listing' | 'user' | 'inquiry' | 'sale';
  label: string; sub: string; time: string;
}

const PIE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--gold))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
];

function StatCard({
  label, value, sub, icon: Icon, href, color, trend, loading,
}: {
  label: string; value: number; sub: string;
  icon: React.ElementType; href: string;
  color: string; trend?: { value: number; positive: boolean };
  loading: boolean;
}) {
  return (
    <Link to={href} className="group block h-full">
      <Card className="h-full hover:border-foreground/25 transition-all duration-200 hover:shadow-sm cursor-pointer">
        <CardContent className="p-5 flex flex-col gap-3 h-full">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Icon className={cn('w-5 h-5', color)} />
            </div>
            {trend && !loading && (
              <div className={cn('flex items-center gap-0.5 text-xs font-medium',
                trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
                {trend.positive
                  ? <TrendingUp className="w-3 h-3" />
                  : <TrendingDown className="w-3 h-3" />}
                {trend.value}%
              </div>
            )}
          </div>
          <div className="flex-1">
            {loading ? (
              <>
                <Skeleton className="h-7 w-16 mb-1" />
                <Skeleton className="h-3.5 w-24" />
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-foreground tabular-nums">{value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </>
            )}
          </div>
          <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
            {label} <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickActions() {
  const actions = [
    { label: 'Add Listing', icon: Plus,         href: '/admin/inventory',   desc: 'New vehicle' },
    { label: 'Moderate',    icon: CheckCircle2,  href: '/admin/moderation',  desc: 'Review pending' },
    { label: 'Inquiries',   icon: MessageSquare, href: '/admin/inquiries',   desc: 'Messages' },
    { label: 'Analytics',   icon: BarChart2,     href: '/admin/analytics',   desc: 'View reports' },
    { label: 'Auctions',    icon: Gavel,         href: '/admin/auctions',    desc: 'Manage bids' },
    { label: 'Settings',    icon: Zap,           href: '/admin/settings',    desc: 'Configure' },
  ];
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
        <CardDescription className="text-xs">Common admin tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {actions.map(a => (
            <Link key={a.href} to={a.href}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:border-foreground/25 hover:bg-secondary/60 transition-all duration-150 group text-center">
              <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <a.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-[11px] font-medium text-foreground leading-tight">{a.label}</span>
              <span className="text-[10px] text-muted-foreground leading-none">{a.desc}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityFeed({ items, loading }: { items: ActivityItem[]; loading: boolean }) {
  const iconMap: Record<ActivityItem['type'], { icon: React.ElementType; color: string; bg: string }> = {
    listing:  { icon: Car,           color: 'text-primary',     bg: 'bg-primary/10' },
    user:     { icon: Users,         color: 'text-blue-500',    bg: 'bg-blue-500/10' },
    inquiry:  { icon: MessageSquare, color: 'text-amber-500',   bg: 'bg-amber-500/10' },
    sale:     { icon: ShoppingBag,   color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  };
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex flex-row items-center justify-between shrink-0">
        <div>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" /> Recent Activity
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">Latest platform events</CardDescription>
        </div>
        <Link to="/admin/inventory" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-0 max-h-72">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-1">
            {items.map((item, idx) => {
              const { icon: Icon, color, bg } = iconMap[item.type];
              return (
                <div key={item.id + idx}
                  className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
                  <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5', bg)}>
                    <Icon className={cn('w-3.5 h-3.5', color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-1">{item.time}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { getSetting } = useSiteSettings();
  const auctionsOn = getSetting('auctions_feature_enabled', 'true') !== 'false';

  const [stats, setStats] = useState<AdminStats>({
    totalCars: 0, activeCars: 0, pendingCars: 0, soldCars: 0,
    totalUsers: 0, totalDealerships: 0, totalAuctions: 0, activeAuctions: 0,
    totalInquiries: 0, newInquiries: 0,
  });
  const [recentCars, setRecentCars] = useState<CarType[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; listings: number; sales: number }[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('cars').select('*', { count: 'exact', head: true }),
      supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('cars').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('dealerships').select('*', { count: 'exact', head: true }),
      supabase.from('auctions').select('*', { count: 'exact', head: true }),
      supabase.from('auctions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('inquiries').select('*', { count: 'exact', head: true }),
      supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'new'),
      supabase.from('cars')
        .select('id,title,brand_name,model_name,year,price,status,images,created_at')
        .order('created_at', { ascending: false }).limit(6),
    ]).then(([tc, ac, pc, sc, tu, td, ta, aa, ti, ni, cars]) => {
      const s: AdminStats = {
        totalCars: tc.count || 0, activeCars: ac.count || 0,
        pendingCars: pc.count || 0, soldCars: sc.count || 0,
        totalUsers: tu.count || 0, totalDealerships: td.count || 0,
        totalAuctions: ta.count || 0, activeAuctions: aa.count || 0,
        totalInquiries: ti.count || 0, newInquiries: ni.count || 0,
      };
      setStats(s);
      setStatusData([
        { name: 'Active',  value: s.activeCars },
        { name: 'Pending', value: s.pendingCars },
        { name: 'Sold',    value: s.soldCars },
        { name: 'Other',   value: Math.max(0, s.totalCars - s.activeCars - s.pendingCars - s.soldCars) },
      ].filter(d => d.value > 0));
      if (cars.data) setRecentCars(cars.data as CarType[]);
      setLoading(false);
    });

    // Monthly data — last 6 months
    supabase.from('cars').select('status, created_at')
      .gte('created_at', new Date(Date.now() - 180 * 86400000).toISOString())
      .then(({ data }) => {
        if (!data) return;
        const m: Record<string, { listings: number; sales: number }> = {};
        data.forEach(c => {
          const key = new Date(c.created_at).toLocaleString('default', { month: 'short' });
          if (!m[key]) m[key] = { listings: 0, sales: 0 };
          m[key].listings++;
          if (c.status === 'sold') m[key].sales++;
        });
        setMonthlyData(Object.entries(m).map(([month, d]) => ({ month, ...d })));
      });

    // Activity feed — merge recent cars + inquiries
    Promise.all([
      supabase.from('cars').select('id,title,brand_name,year,status,created_at')
        .order('created_at', { ascending: false }).limit(5),
      supabase.from('inquiries').select('id,name,message,status,created_at')
        .order('created_at', { ascending: false }).limit(5),
    ]).then(([cars, inquiries]) => {
      const feed: ActivityItem[] = [];
      (cars.data || []).forEach(c => feed.push({
        id: c.id, type: c.status === 'sold' ? 'sale' : 'listing',
        label: `${c.year} ${c.brand_name || ''} ${c.title}`,
        sub: c.status === 'sold' ? 'Vehicle sold' : `Listed · ${c.status}`,
        time: formatDate(c.created_at),
      }));
      (inquiries.data || []).forEach((q: Record<string, unknown>) => feed.push({
        id: q.id as string, type: 'inquiry',
        label: `Inquiry from ${q.name || 'Visitor'}`,
        sub: ((q.message as string) || '').slice(0, 50) + ((q.message as string || '').length > 50 ? '…' : ''),
        time: formatDate(q.created_at as string),
      }));
      feed.sort((a, b) => b.time.localeCompare(a.time));
      setActivityItems(feed.slice(0, 10));
    });
  }, []);

  const statCards = [
    {
      label: 'Total Vehicles', value: stats.totalCars,
      sub: `${stats.activeCars} active · ${stats.pendingCars} pending`,
      icon: Car, href: '/admin/inventory', color: 'text-primary',
      trend: { value: 12, positive: true },
    },
    {
      label: 'Pending Review', value: stats.pendingCars,
      sub: 'Awaiting approval',
      icon: Clock, href: '/admin/moderation', color: 'text-amber-500',
      trend: undefined,
    },
    {
      label: 'Total Users', value: stats.totalUsers,
      sub: 'Registered accounts',
      icon: Users, href: '/admin/users', color: 'text-blue-500',
      trend: { value: 8, positive: true },
    },
    {
      label: 'Dealerships', value: stats.totalDealerships,
      sub: 'Active partners',
      icon: Building2, href: '/admin/dealerships', color: 'text-emerald-500',
      trend: { value: 3, positive: true },
    },
    ...(auctionsOn ? [{
      label: 'Auctions', value: stats.totalAuctions,
      sub: `${stats.activeAuctions} live now`,
      icon: Gavel, href: '/admin/auctions', color: 'text-purple-500',
      trend: undefined,
    }] : []),
    {
      label: 'Inquiries', value: stats.totalInquiries,
      sub: `${stats.newInquiries} unread`,
      icon: MessageSquare, href: '/admin/inquiries', color: 'text-orange-500',
      trend: { value: 5, positive: false },
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 pb-6">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">{t('adminDashboard') || 'Dashboard'}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Platform overview and key metrics</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button asChild size="sm" variant="ghost" className="h-8 text-xs border border-border gap-1.5">
              <Link to="/"><Eye className="w-3.5 h-3.5" /> View Site</Link>
            </Button>
            <Button asChild size="sm" className="h-8 text-xs gap-1.5">
              <Link to="/admin/inventory"><Plus className="w-3.5 h-3.5" /> Add Listing</Link>
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
          {statCards.map(s => (
            <StatCard key={s.label} {...s} loading={loading} />
          ))}
        </div>

        {/* Quick actions */}
        <QuickActions />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

          {/* Monthly bar chart — spans 2 cols */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Listings vs Sales</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Monthly performance (last 6 months)</CardDescription>
                </div>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="w-full h-52" />
              ) : monthlyData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
              ) : (
                <div className="w-full h-52 min-w-0 overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                        cursor={{ fill: 'hsl(var(--secondary))' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} layout="horizontal" />
                      <Bar dataKey="listings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Listings" />
                      <Bar dataKey="sales" fill="hsl(var(--gold))" radius={[4, 4, 0, 0]} name="Sales" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status distribution pie */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Inventory Status</CardTitle>
              <CardDescription className="text-xs mt-0.5">Breakdown by listing status</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="w-full h-52" />
              ) : statusData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
              ) : (
                <div className="w-full h-52 min-w-0 overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="45%" innerRadius={48} outerRadius={72}
                        dataKey="value" paddingAngle={3}>
                        {statusData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} layout="horizontal" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent listings + Activity feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

          {/* Recent listings */}
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between shrink-0">
              <div>
                <CardTitle className="text-sm font-semibold">Recent Listings</CardTitle>
                <CardDescription className="text-xs mt-0.5">Latest vehicles added</CardDescription>
              </div>
              <Link to="/admin/inventory"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto min-h-0 max-h-72">
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-14 h-10 rounded-md shrink-0" />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-5 w-14 rounded-full shrink-0" />
                    </div>
                  ))}
                </div>
              ) : recentCars.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No listings yet</p>
              ) : (
                <div className="space-y-1">
                  {recentCars.map(car => (
                    <Link key={car.id} to="/admin/inventory"
                      className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0 hover:bg-secondary/40 -mx-1 px-1 rounded-md transition-colors">
                      {Array.isArray(car.images) && car.images[0] ? (
                        <img src={car.images[0]} alt={car.title}
                          className="w-14 h-10 object-cover rounded-md shrink-0" />
                      ) : (
                        <div className="w-14 h-10 bg-secondary rounded-md shrink-0 flex items-center justify-center">
                          <Car className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{car.year} {car.brand_name} {car.model_name}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(car.price)}</p>
                      </div>
                      <Badge className={cn('text-xs capitalize shrink-0', getStatusColor(car.status))}>
                        {car.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity feed */}
          <ActivityFeed items={activityItems} loading={loading} />
        </div>

        {/* Trend line chart */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Listing Trend</CardTitle>
                <CardDescription className="text-xs mt-0.5">Monthly listing and sales trend</CardDescription>
              </div>
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="w-full h-40" />
            ) : monthlyData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
            ) : (
              <div className="w-full h-40 min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="listings" stroke="hsl(var(--primary))"
                      strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--primary))' }} name="Listings" />
                    <Line type="monotone" dataKey="sales" stroke="hsl(var(--gold))"
                      strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--gold))' }} name="Sales" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </AdminLayout>
  );
}
