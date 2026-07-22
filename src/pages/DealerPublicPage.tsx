import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Phone, Mail, Building2, Star, Car, Award, ChevronRight, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { CarCard } from '@/components/cars/CarCard';
import { supabase } from '@/db/supabase';
import { formatCurrency } from '@/lib/utils-xyz';
import { toast } from 'sonner';
import type { Dealership, Car as CarType } from '@/types/types';
import { useLanguage } from '@/contexts/LanguageContext';

export default function DealerPublicPage() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dealership, setDealership] = useState<Dealership | null>(null);
  const [cars, setCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, sold: 0, active: 0 });
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('dealerships').select('*').eq('id', id).maybeSingle(),
      supabase.from('cars').select('*').eq('dealership_id', id).eq('status', 'active').order('created_at', { ascending: false }).limit(6),
      supabase.from('cars').select('*', { count: 'exact', head: true }).eq('dealership_id', id),
      supabase.from('cars').select('*', { count: 'exact', head: true }).eq('dealership_id', id).eq('status', 'sold'),
      supabase.from('cars').select('*', { count: 'exact', head: true }).eq('dealership_id', id).eq('status', 'active'),
    ]).then(([{ data: d }, { data: c }, totalRes, soldRes, activeRes]) => {
      setDealership(d as Dealership);
      setCars((c as CarType[]) || []);
      setStats({ total: totalRes.count || 0, sold: soldRes.count || 0, active: activeRes.count || 0 });
      setLoading(false);
    });
  }, [id]);

  const sendInquiry = async () => {
    if (!form.name || !form.email || !form.message) { toast.error('Please fill required fields'); return; }
    setSending(true);
    try {
      const { error } = await supabase.from('inquiries').insert({
        dealership_id: id,
        name: form.name, email: form.email,
        phone: form.phone || null, message: form.message,
      });
      if (error) throw error;
      toast.success('Message sent to dealership!');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to send message: ' + (e.message || 'Unknown error'));
    } finally { setSending(false); }
  };

  if (loading) return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-12 space-y-8">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-4"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
      </div>
    </PublicLayout>
  );

  if (!dealership) return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <p className="text-muted-foreground">Dealership not found.</p>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mt-4">Go Home</Button>
      </div>
    </PublicLayout>
  );

  return (
    <PublicLayout>
      <Helmet>
        <title>{`${dealership.name} | XYZ Automobiles Dealer`}</title>
        <meta name="description" content={`${dealership.name} — Verified dealership on XYZ Automobiles. ${stats.active} vehicles available.`} />
      </Helmet>
      <div className="pt-[68px] min-h-screen">
        {/* Hero */}
        <div className="section-bg-dark-premium">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-16 h-16 bg-primary-foreground/10 rounded-xl flex items-center justify-center shrink-0">
                {dealership.logo_url
                  ? <img src={dealership.logo_url} alt={dealership.name} className="w-12 h-12 object-contain" />
                  : <Building2 className="w-8 h-8" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">{dealership.name}</h1>
                  {dealership.is_verified && (
                    <Badge className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                      <Award className="w-3 h-3 mr-1" /> Verified
                    </Badge>
                  )}
                </div>
                {dealership.city && (
                  <p className="flex items-center gap-1.5 text-primary-foreground/70 text-sm">
                    <MapPin className="w-3.5 h-3.5" /> {dealership.city}, Pakistan
                  </p>
                )}
                {dealership.description && (
                  <p className="text-primary-foreground/65 text-sm mt-2 max-w-xl text-pretty">{dealership.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="border-b border-border bg-secondary/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
            <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-xl">
              {[
                { label: 'Total Listings', value: stats.total, icon: Car },
                { label: 'Available Now', value: stats.active, icon: Star },
                { label: 'Cars Sold', value: stats.sold, icon: Award },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Inventory */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Available Vehicles</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/inventory?dealership_id=${id}`)} className="text-xs">
                  View all <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
              {cars.length === 0 ? (
                <div className="py-12 text-center border border-border rounded-xl">
                  <p className="text-muted-foreground text-sm">No vehicles listed currently.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cars.map(car => <CarCard key={car.id} car={car} />)}
                </div>
              )}
            </div>

            {/* Contact */}
            <div className="space-y-4">
              {/* Contact info */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Contact Information</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {dealership.phone && (
                    <a href={`tel:${dealership.phone}`} className="flex items-center gap-2.5 text-sm hover:text-foreground text-muted-foreground transition-colors">
                      <Phone className="w-4 h-4 shrink-0" /> {dealership.phone}
                    </a>
                  )}
                  {dealership.email && (
                    <a href={`mailto:${dealership.email}`} className="flex items-center gap-2.5 text-sm hover:text-foreground text-muted-foreground transition-colors">
                      <Mail className="w-4 h-4 shrink-0" /> {dealership.email}
                    </a>
                  )}
                  {dealership.address && (
                    <p className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5" /> {dealership.address}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Contact form */}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Send a Message</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs mb-1 block">Name *</Label>
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Email *</Label>
                    <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Phone</Label>
                    <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+92..." className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Message *</Label>
                    <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="text-sm min-h-[80px] resize-none" placeholder="How can we help you?" />
                  </div>
                  <Button onClick={sendInquiry} disabled={sending} className="w-full h-9 text-sm">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
