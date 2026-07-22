import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, Users, TrendingUp, MessageSquare, Eye, Plus, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DealershipLayout } from '@/components/layouts/DealershipLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils-xyz';
import type { Car as CarType, Inquiry, DealershipActivityLog } from '@/types/types';
import { useLanguage } from '@/contexts/LanguageContext';

export default function DealershipDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, active: 0, sold: 0, pending: 0, inquiries: 0, views: 0 });
  const [recentCars, setRecentCars] = useState<CarType[]>([]);
  const [recentInquiries, setRecentInquiries] = useState<Inquiry[]>([]);
  const [activity, setActivity] = useState<DealershipActivityLog[]>([]);
  const [dealershipId, setDealershipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('dealership_members').select('dealership_id').eq('user_id', user.id).eq('is_active', true).maybeSingle()
      .then(({ data }) => {
        if (!data?.dealership_id) { setLoading(false); return; }
        const did = data.dealership_id;
        setDealershipId(did);
        return Promise.all([
          supabase.from('cars').select('*', { count: 'exact', head: true }).eq('dealership_id', did),
          supabase.from('cars').select('*', { count: 'exact', head: true }).eq('dealership_id', did).eq('status', 'active'),
          supabase.from('cars').select('*', { count: 'exact', head: true }).eq('dealership_id', did).eq('status', 'sold'),
          supabase.from('cars').select('*', { count: 'exact', head: true }).eq('dealership_id', did).eq('status', 'pending'),
          supabase.from('inquiries').select('*', { count: 'exact', head: true }),
          supabase.from('cars').select('id,title,brand_name,model_name,year,images,price,status,created_at').eq('dealership_id', did).order('created_at', { ascending: false }).limit(5),
          supabase.from('inquiries').select('*, car:cars(id,title)').eq('status', 'new').order('created_at', { ascending: false }).limit(5),
          supabase.from('dealership_activity_log').select('*, profile:profiles(full_name)').eq('dealership_id', did).order('created_at', { ascending: false }).limit(10),
        ]).then(([t, a, s, p, , cars, inq, act]) => {
          setStats({ total: t.count || 0, active: a.count || 0, sold: s.count || 0, pending: p.count || 0, inquiries: 0, views: 0 });
          if (cars.data) setRecentCars(cars.data as CarType[]);
          if (inq.data) setRecentInquiries(inq.data as Inquiry[]);
          if (act.data) setActivity(act.data as DealershipActivityLog[]);
          setLoading(false);
        });
      });
  }, [user]);

  const statCards = [
    { label: 'Total Listings', value: stats.total, icon: Car, href: '/dealership/inventory' },
    { label: 'Active', value: stats.active, icon: TrendingUp, href: '/dealership/inventory' },
    { label: 'Sold', value: stats.sold, icon: TrendingUp, href: '/dealership/sales' },
    { label: 'Pending Review', value: stats.pending, icon: Eye, href: '/dealership/inventory' },
  ];

  return (
    <DealershipLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Overview of your dealership performance</p>
          </div>
          <Button asChild size="sm" className="h-9 gap-1.5">
            <Link to="/dealership/inventory"><Plus className="w-3.5 h-3.5" /> Add Listing</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(stat => (
            <Link key={stat.label} to={stat.href}>
              <Card className="h-full hover:border-foreground/20 transition-colors">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {loading ? '...' : stat.value}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-primary/5 rounded-md flex items-center justify-center">
                      <stat.icon className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Listings */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent Listings</CardTitle>
              <Link to="/dealership/inventory" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentCars.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No listings yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentCars.map(car => (
                    <div key={car.id} className="flex items-center gap-3">
                      {Array.isArray(car.images) && car.images[0] ? (
                        <img src={car.images[0]} alt={car.title} className="w-12 h-9 object-cover rounded-md shrink-0" />
                      ) : (
                        <div className="w-12 h-9 bg-muted rounded-md shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{car.year} {car.brand_name} {car.model_name}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(car.price)}</p>
                      </div>
                      <Badge className={`text-xs capitalize shrink-0 ${getStatusColor(car.status)}`}>{car.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {activity.map(log => (
                    <div key={log.id} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-foreground">{log.description || log.action}</p>
                        <p className="text-[10px] text-muted-foreground">{formatDate(log.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DealershipLayout>
  );
}
