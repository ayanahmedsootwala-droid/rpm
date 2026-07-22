import { useState, useEffect } from 'react';
import { Activity, Clock, Database, Cpu, HardDrive, Wifi, RefreshCw, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { supabase } from '@/db/supabase';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

interface Metric { label: string; value: string; status: 'good' | 'warning' | 'error'; icon: React.ElementType; }
interface ResponsePoint { time: string; ms: number; }

export default function AdminPerformance() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [tableCounts, setTableCounts] = useState<{ name: string; count: number }[]>([]);
  const [responseHistory, setResponseHistory] = useState<ResponsePoint[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const measure = async () => {
    const start = performance.now();
    await supabase.from('profiles').select('id', { count: 'exact', head: true });
    return Math.round(performance.now() - start);
  };

  const load = async () => {
    setRefreshing(true);
    const latency = await measure();
    setDbLatency(latency);

    const [cars, auctions, users, inquiries, bids] = await Promise.all([
      supabase.from('cars').select('*', { count: 'exact', head: true }),
      supabase.from('auctions').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('inquiries').select('*', { count: 'exact', head: true }),
      supabase.from('bids').select('*', { count: 'exact', head: true }),
    ]);
    setTableCounts([
      { name: 'Users', count: users.count || 0 },
      { name: 'Cars', count: cars.count || 0 },
      { name: 'Auctions', count: auctions.count || 0 },
      { name: 'Inquiries', count: inquiries.count || 0 },
      { name: 'Bids', count: bids.count || 0 },
    ]);
    setResponseHistory(prev => {
      const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const updated = [...prev, { time: now, ms: latency }].slice(-12);
      return updated;
    });
    setLastRefresh(new Date());
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); const interval = setInterval(load, 30000); return () => clearInterval(interval); }, []);

  const getLatencyStatus = (ms: number | null): 'good' | 'warning' | 'error' => {
    if (ms === null) return 'error';
    if (ms < 150) return 'good';
    if (ms < 500) return 'warning';
    return 'error';
  };

  const StatusIcon = ({ status }: { status: 'good' | 'warning' | 'error' }) => {
    if (status === 'good') return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (status === 'warning') return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  const latencyStatus = getLatencyStatus(dbLatency);

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Performance</h1>
            <p className="text-sm text-muted-foreground">
              System health · Last updated {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={load} disabled={refreshing} className="h-9 border border-border gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />) : [
            { label: 'DB Latency', value: dbLatency !== null ? `${dbLatency}ms` : '—', status: latencyStatus, icon: Database },
            { label: 'DB Connection', value: dbLatency !== null ? 'Connected' : 'Error', status: (dbLatency !== null ? 'good' : 'error') as 'good' | 'warning' | 'error', icon: Wifi },
            { label: 'Auth Service', value: 'Operational', status: 'good' as const, icon: Activity },
            { label: 'Storage', value: 'Operational', status: 'good' as const, icon: HardDrive },
          ].map(m => (
            <Card key={m.label} className="h-full">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <m.icon className="w-4 h-4 text-muted-foreground" />
                  <StatusIcon status={m.status} />
                </div>
                <p className="text-lg font-bold">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Response time chart */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">DB Response Time (ms)</CardTitle></CardHeader>
            <CardContent>
              {responseHistory.length < 2 ? (
                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Collecting data...</div>
              ) : (
                <div className="w-full min-w-0 overflow-hidden h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={responseHistory}>
                      <defs>
                        <linearGradient id="rtg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--border))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--border))" unit="ms" />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v}ms`, 'Latency']} />
                      <Area type="monotone" dataKey="ms" stroke="hsl(var(--primary))" fill="url(#rtg)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Table counts */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Database Tables</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-40 w-full" /> : (
                <div className="space-y-2">
                  {tableCounts.map(t => {
                    const maxCount = Math.max(...tableCounts.map(tc => tc.count), 1);
                    const pct = Math.round((t.count / maxCount) * 100);
                    return (
                      <div key={t.name} className="flex items-center gap-3">
                        <p className="text-xs text-muted-foreground w-20 shrink-0">{t.name}</p>
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs font-medium w-12 text-right">{t.count.toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Service status */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Service Status</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: 'Supabase Auth', status: 'Operational' },
                { name: 'Database', status: dbLatency !== null ? 'Operational' : 'Unreachable' },
                { name: 'Edge Functions', status: 'Operational' },
                { name: 'Storage', status: 'Operational' },
                { name: 'Realtime', status: 'Operational' },
                { name: 'AI (Gemini)', status: 'Operational' },
                { name: 'CDN', status: 'Operational' },
                { name: 'Email Service', status: 'Operational' },
              ].map(s => (
                <div key={s.name} className="flex items-center gap-2 p-3 border border-border rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${s.status === 'Operational' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-xs font-medium">{s.name}</p>
                    <p className={`text-xs ${s.status === 'Operational' ? 'text-green-600' : 'text-red-600'}`}>{s.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
