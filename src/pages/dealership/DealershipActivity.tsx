import { useState, useEffect } from 'react';
import { Activity, Car, MessageSquare, Users, Settings, RefreshCw, Clock, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DealershipLayout } from '@/components/layouts/DealershipLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import type { DealershipActivityLog } from '@/types/types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const ACTION_META: Record<string, { icon: React.ElementType; color: string }> = {
  car_added:         { icon: Car,          color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' },
  car_updated:       { icon: Car,          color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' },
  car_deleted:       { icon: Car,          color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' },
  inquiry_replied:   { icon: MessageSquare,color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' },
  inquiry_received:  { icon: MessageSquare,color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200' },
  member_added:      { icon: Users,        color: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200' },
  member_removed:    { icon: Users,        color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' },
  settings_updated:  { icon: Settings,     color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200' },
};

function getMeta(action: string) {
  return ACTION_META[action] || { icon: Activity, color: 'bg-primary/10 text-primary' };
}

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function DealershipActivity() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [logs, setLogs] = useState<DealershipActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dealershipId, setDealershipId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('dealership_members').select('dealership_id').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => { if (data?.dealership_id) setDealershipId(data.dealership_id); else setLoading(false); });
  }, [user]);

  const loadLogs = async () => {
    if (!dealershipId) return;
    setRefreshing(true);
    const { data } = await supabase
      .from('dealership_activity_log')
      .select('*, profile:profiles(full_name)')
      .eq('dealership_id', dealershipId)
      .order('created_at', { ascending: false })
      .limit(200);
    if (data) setLogs(data as DealershipActivityLog[]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadLogs(); }, [dealershipId]);

  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  const filtered = logs.filter(log => {
    const matchSearch = !search ||
      (log.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.profile?.full_name || '').toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    return matchSearch && matchAction;
  });

  const today = new Date().toDateString();
  const todayCount = logs.filter(l => new Date(l.created_at).toDateString() === today).length;
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekCount = logs.filter(l => new Date(l.created_at) >= weekAgo).length;

  // Group by date label
  const grouped: Record<string, DealershipActivityLog[]> = {};
  filtered.forEach(log => {
    const key = new Date(log.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(log);
  });

  return (
    <DealershipLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold">Activity Log</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Full audit trail for your dealership</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadLogs} disabled={refreshing} className="gap-2">
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} /> Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Events', value: logs.length, icon: Activity },
            { label: 'Today', value: todayCount, icon: Clock },
            { label: 'This Week', value: weekCount, icon: Filter },
          ].map(s => (
            <Card key={s.label} className="h-full">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold mt-0.5">{s.value}</p>
                </div>
                <s.icon className="w-5 h-5 text-muted-foreground opacity-40" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search activity…" className="pl-8 h-9 text-sm" />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="h-9 text-sm w-44 shrink-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {uniqueActions.map(a => (
                <SelectItem key={a} value={a}>{formatAction(a)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Timeline */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No activity found</p>
                <p className="text-xs mt-1">{search ? 'Try a different search term' : 'Actions will appear here as they happen'}</p>
              </div>
            ) : (
              <>
                {Object.entries(grouped).map(([date, dayLogs]) => (
                  <div key={date}>
                    <div className="px-4 py-2 bg-muted/30 border-b border-t border-border first:border-t-0">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{date}</p>
                    </div>
                    {dayLogs.map((log, idx) => {
                      const { icon: Icon, color } = getMeta(log.action);
                      return (
                        <div key={log.id} className={cn('flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors', idx < dayLogs.length - 1 && 'border-b border-border/40')}>
                          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5', color)}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm text-foreground leading-snug">{log.description || formatAction(log.action)}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0">{formatAction(log.action)}</Badge>
                                  {log.profile?.full_name && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Avatar className="w-3.5 h-3.5 shrink-0">
                                        <AvatarFallback className="text-[8px]">{log.profile.full_name.charAt(0).toUpperCase()}</AvatarFallback>
                                      </Avatar>
                                      {log.profile.full_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                                {new Date(log.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div className="px-4 py-3 border-t border-border text-center">
                  <p className="text-xs text-muted-foreground">Showing {filtered.length} of {logs.length} events</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DealershipLayout>
  );
}
