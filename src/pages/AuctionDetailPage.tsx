import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Clock, Gavel, TrendingUp, Users, Heart,
  Shield, AlertCircle, Check, X, Loader2, Bot, Info, Fuel, Gauge,
  Calendar, MapPin, Tag, BadgeCheck, Eye, Share2, Bell, Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { useAuction } from '@/hooks/useAuctions';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { formatCurrency, formatDate } from '@/lib/utils-xyz';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BidEntry {
  id: string;
  amount: number;
  bidder_name: string;
  created_at: string;
  is_own?: boolean;
}

function Countdown({ endTime }: { endTime: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: false });
  useEffect(() => {
    const calc = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true }); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        ended: false,
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endTime]);

  if (timeLeft.ended) return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Clock className="w-4 h-4" /><span className="text-sm font-medium">Auction Ended</span>
    </div>
  );

  const urgent = timeLeft.days === 0 && timeLeft.hours < 2;
  return (
    <div className="flex items-center gap-2">
      {[{ label: 'Days', value: timeLeft.days }, { label: 'Hrs', value: timeLeft.hours }, { label: 'Min', value: timeLeft.minutes }, { label: 'Sec', value: timeLeft.seconds }].map(({ label, value }, i) => (
        <div key={label} className="flex items-center">
          <div className="text-center">
            <div className={cn('text-xl font-bold tabular-nums w-12 h-12 rounded-xl flex items-center justify-center transition-colors', urgent ? 'bg-destructive text-destructive-foreground animate-pulse' : 'bg-primary text-primary-foreground')}>
              {String(value).padStart(2, '0')}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
          </div>
          {i < 3 && <span className="text-muted-foreground mx-1.5 text-lg font-bold pb-5">:</span>}
        </div>
      ))}
    </div>
  );
}

export default function AuctionDetailPage() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const { auction, setAuction, loading } = useAuction(id!);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bidAmount, setBidAmount] = useState('');
  const [proxyAmount, setProxyAmount] = useState('');
  const [placing, setPlacing] = useState(false);
  const [settingProxy, setSettingProxy] = useState(false);
  const [proxyOpen, setProxyOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [bids, setBids] = useState<BidEntry[]>([]);
  const [loadingBids, setLoadingBids] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [hasDeposit, setHasDeposit] = useState(false);
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const effectiveBid = auction?.current_bid ?? auction?.current_price ?? auction?.starting_bid ?? 0;
  const bidIncrement = auction?.bid_increment ?? 50000;
  const minBid = effectiveBid + bidIncrement;
  const reserveMet = !!(auction?.reserve_price && effectiveBid >= auction.reserve_price);
  const progressPercent = auction?.reserve_price ? Math.min(100, (effectiveBid / auction.reserve_price) * 100) : 0;
  const isActive = auction?.status === 'active';

  const [bidsPage, setBidsPage] = useState(1);
  const [hasMoreBids, setHasMoreBids] = useState(true);

  const fetchBids = useCallback(async (page = 1, append = false) => {
    if (!id) return;
    const limit = 10;
    const { data } = await supabase
      .from('bids')
      .select('id, amount, created_at, user_id')
      .eq('auction_id', id)
      .order('amount', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    if (data) {
      if (data.length < limit) setHasMoreBids(false);
      else setHasMoreBids(true);
      const formatted = data.map(b => ({
        id: b.id,
        amount: b.amount,
        bidder_name: b.user_id === user?.id ? '★ You' : `Bidder ${b.user_id.slice(0, 4).toUpperCase()}`,
        created_at: b.created_at,
        is_own: b.user_id === user?.id,
      }));
      setBids(prev => append ? [...prev, ...formatted] : formatted);
    }
    setLoadingBids(false);
  }, [id, user?.id]);

  const loadMoreBids = () => {
    const nextPage = bidsPage + 1;
    setBidsPage(nextPage);
    fetchBids(nextPage, true);
  };

  const checkWatchlist = useCallback(async () => {
    if (!user || !id) return;
    const { data } = await supabase.from('auction_watchlist').select('id').eq('user_id', user.id).eq('auction_id', id).maybeSingle();
    setIsWatchlisted(!!data);
  }, [user, id]);

  const checkDeposit = useCallback(async () => {
    if (!user || !id) return;
    const { data } = await supabase.from('auction_deposits').select('id, status').eq('user_id', user.id).eq('auction_id', id).maybeSingle();
    setHasDeposit(!!(data && (data.status === 'approved' || data.status === 'pending')));
  }, [user, id]);

  useEffect(() => { fetchBids(); checkWatchlist(); checkDeposit(); }, [fetchBids, checkWatchlist, checkDeposit]);

  // Real-time bids & auction updates
  useEffect(() => {
    if (!id) return;
    const channelName = `auction-room-${id}-${Math.random().toString(36).substring(2, 10)}`;
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids', filter: `auction_id=eq.${id}` },
        (payload) => {
          const b = payload.new as { id: string; amount: number; user_id: string; created_at: string };
          setBids(prev => {
            // Check for outbid notification
            if (prev.length > 0) {
              const previousHighest = prev[0];
              if (previousHighest.is_own && b.user_id !== user?.id) {
                toast.error(`You have been outbid! Someone just bid ${formatCurrency(b.amount)}`);
              } else if (b.user_id !== user?.id) {
                toast.info(`New bid: ${formatCurrency(b.amount)}`);
              }
            }
            return [{
              id: b.id, amount: b.amount,
              bidder_name: b.user_id === user?.id ? '★ You' : `Bidder ${b.user_id.slice(0, 4).toUpperCase()}`,
              created_at: b.created_at, is_own: b.user_id === user?.id,
            }, ...prev.slice(0, 29)];
          });
          const el = document.getElementById('current-bid-display');
          if (el) { el.classList.add('bid-flash'); setTimeout(() => el.classList.remove('bid-flash'), 800); }
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'auctions', filter: `id=eq.${id}` },
        (payload) => {
          const updated = payload.new as any;
          setAuction(prev => prev ? { ...prev, ...updated } : prev);
          // If end time was extended, show a notification
          if (auction?.end_time && updated.end_time && new Date(updated.end_time).getTime() > new Date(auction.end_time).getTime()) {
            toast.info("Auction time has been extended!");
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, user?.id, auction?.end_time, setAuction]);

  async function placeBid() {
    if (!user) { navigate('/login'); return; }
    if (!hasDeposit && auction?.deposit_amount) { 
      toast.error('Deposit required to place bids.');
      setDepositOpen(true);
      return; 
    }
    const amount = Number(bidAmount);
    if (!amount || amount < minBid) { toast.error(`Minimum bid is ${formatCurrency(minBid)}`); return; }
    setPlacing(true);
    try {
      const { data, error } = await supabase.rpc('place_bid', {
        p_auction_id: id,
        p_user_id: user.id,
        p_amount: amount,
        p_max_amount: null
      });
      if (error) throw error;
      if (data?.success === false) {
        toast.error(data.message);
      } else {
        toast.success(`Bid of ${formatCurrency(amount)} placed!`);
        setBidAmount('');
      }
      fetchBids();
    } catch (err) { toast.error((err as Error).message || 'Failed to place bid'); }
    finally { setPlacing(false); }
  }

  async function setProxyBid() {
    if (!user) { navigate('/login'); return; }
    if (!hasDeposit && auction?.deposit_amount) { 
      toast.error('Deposit required to place proxy bids.');
      setDepositOpen(true);
      return; 
    }
    const amount = Number(proxyAmount);
    if (!amount || amount <= minBid) { toast.error(`Proxy max must exceed ${formatCurrency(minBid)}`); return; }
    setSettingProxy(true);
    try {
      const { data, error } = await supabase.rpc('place_bid', {
        p_auction_id: id,
        p_user_id: user.id,
        p_amount: minBid,
        p_max_amount: amount
      });
      if (error) throw error;
      if (data?.success === false) {
        toast.error(data.message);
      } else {
        toast.success("Proxy bid activated! We'll bid for you automatically.");
        setProxyOpen(false); setProxyAmount('');
      }
      fetchBids();
    } catch (err) { toast.error((err as Error).message || 'Failed to set proxy bid'); }
    finally { setSettingProxy(false); }
  }

  async function submitDeposit() {
    if (!user || !auction) { navigate('/login'); return; }
    setDepositSubmitting(true);
    try {
      const { error } = await supabase.from('auction_deposits').insert({ auction_id: id, user_id: user.id, amount: auction.deposit_amount || 50000, status: 'pending' });
      if (error) throw error;
      toast.success('Deposit request submitted. Admin will approve shortly.');
      setHasDeposit(true); setDepositOpen(false);
    } catch (err) { toast.error((err as Error).message || 'Failed to submit deposit'); }
    finally { setDepositSubmitting(false); }
  }

  async function toggleWatchlist() {
    if (!user) { navigate('/login'); return; }
    setWatchlistLoading(true);
    if (isWatchlisted) {
      await supabase.from('auction_watchlist').delete().eq('user_id', user.id).eq('auction_id', id);
      setIsWatchlisted(false); toast.info('Removed from watchlist');
    } else {
      await supabase.from('auction_watchlist').insert({ user_id: user.id, auction_id: id });
      setIsWatchlisted(true); toast.success('Added to watchlist');
    }
    setWatchlistLoading(false);
  }

  function shareAuction() {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  }

  // Bid chart data
  const bidChartData = [...bids].reverse().map((b, i) => ({
    bid: i + 1,
    amount: b.amount,
    label: formatCurrency(b.amount),
  }));

  const images = auction?.car_images?.length ? auction.car_images : auction?.car?.images?.length ? auction.car.images : [];

  if (loading) return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" /><Skeleton className="h-16 w-full" /><Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    </PublicLayout>
  );

  if (!auction) return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-40" />
        <p className="text-muted-foreground">Auction not found.</p>
        <Button variant="ghost" size="sm" onClick={() => navigate('/auctions')} className="mt-4"><ChevronLeft className="w-4 h-4 mr-1" />Back to Auctions</Button>
      </div>
    </PublicLayout>
  );

  const car = auction.car;

  return (
    <PublicLayout>
      <Helmet>
        <title>{`${auction.title} | XYZ Auctions`}</title>
        <meta name="description" content={`Bid on ${auction.title}. Current bid: ${formatCurrency(effectiveBid)}`} />
      </Helmet>

      <div className="pt-[68px] min-h-screen">
        {/* Breadcrumb */}
        <div className="border-b border-border/20 section-bg-dark-premium sticky top-16 z-10">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-2.5 flex items-center justify-between gap-2">
            <nav className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
              <Link to="/" className="hover:text-foreground shrink-0">{t('home')}</Link>
              <ChevronRight className="w-3 h-3 shrink-0" />
              <Link to="/auctions" className="hover:text-foreground shrink-0">{t('auctions')}</Link>
              <ChevronRight className="w-3 h-3 shrink-0" />
              <span className="text-foreground truncate">{auction.title}</span>
            </nav>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={shareAuction} title="Share">
                <Share2 className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className={cn('h-8 w-8', isWatchlisted && 'text-destructive')} onClick={toggleWatchlist} disabled={watchlistLoading} title={t('watchlist')}>
                <Heart className={cn('w-3.5 h-3.5', isWatchlisted && 'fill-current')} />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10">

            {/* LEFT: Gallery + Details */}
            <div className="space-y-6">
              {/* Gallery */}
              <div className="space-y-3">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted cursor-zoom-in" onClick={() => setLightbox(true)}>
                  {images.length > 0 ? (
                    <img src={images[currentImage]} alt={auction.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Info className="w-10 h-10 opacity-30" /></div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                    <Badge className={cn('text-xs', isActive ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground')}>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white live-dot mr-1.5 inline-block" />}
                      {auction.status?.toUpperCase()}
                    </Badge>
                    {reserveMet && <Badge className="bg-gold text-gold-foreground text-xs">Reserve Met ✓</Badge>}
                    {!reserveMet && auction.reserve_price && <Badge variant="secondary" className="text-xs">Reserve Not Met</Badge>}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm flex items-center gap-1">
                    <Eye className="w-3 h-3" />{images.length} photos
                  </div>
                  {images.length > 1 && (
                    <>
                      <button onClick={e => { e.stopPropagation(); setCurrentImage(i => (i - 1 + images.length) % images.length); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setCurrentImage(i => (i + 1) % images.length); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((img, i) => (
                      <button key={i} onClick={() => setCurrentImage(i)}
                        className={cn('shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all', i === currentImage ? 'border-primary' : 'border-transparent opacity-50 hover:opacity-80')}>
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Detail Tabs */}
              <Tabs defaultValue="specs">
                <TabsList><TabsTrigger value="specs">Specifications</TabsTrigger><TabsTrigger value="bids">Bid History ({bids.length})</TabsTrigger><TabsTrigger value="chart">Bid Chart</TabsTrigger></TabsList>

                {/* Specs */}
                <TabsContent value="specs" className="mt-4">
                  {car ? (
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-base">Vehicle Specifications</CardTitle></CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {[
                            { icon: Calendar, label: 'Year', value: car.year },
                            { icon: Gauge, label: 'Mileage', value: car.mileage ? `${car.mileage.toLocaleString()} km` : 'N/A' },
                            { icon: Fuel, label: 'Fuel', value: car.fuel_type || 'N/A' },
                            { icon: Tag, label: 'Transmission', value: car.transmission || 'N/A' },
                            { icon: MapPin, label: 'City', value: car.registration_city || car.city || 'N/A' },
                            { icon: BadgeCheck, label: 'Condition', value: car.condition || 'Used' },
                            { icon: Tag, label: 'Engine', value: car.engine_capacity ? `${car.engine_capacity}cc` : 'N/A' },
                            { icon: Tag, label: 'Color', value: car.color || 'N/A' },
                            { icon: Tag, label: 'Body Type', value: car.body_type || 'N/A' },
                          ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-start gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className="text-sm font-medium mt-0.5">{String(value)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {car.features && car.features.length > 0 && (
                          <div className="mt-5 pt-4 border-t border-border">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Features</p>
                            <div className="flex flex-wrap gap-1.5">
                              {car.features.map(f => (
                                <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {car.description && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">{car.description}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground text-sm">No vehicle specifications available.</div>
                  )}
                </TabsContent>

                {/* Bid History */}
                <TabsContent value="bids" className="mt-4">
                  <Card>
                    <CardContent className="p-0">
                      {loadingBids ? (
                        <div className="p-4 space-y-2">{Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                      ) : bids.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Gavel className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">No bids yet. Be the first to bid!</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border max-h-80 overflow-y-auto overflow-x-hidden">
                          <AnimatePresence initial={false}>
                            {bids.map((bid, i) => (
                              <motion.div 
                                key={bid.id} 
                                initial={{ opacity: 0, y: -20, backgroundColor: 'hsl(var(--gold)/0.2)' }}
                                animate={{ opacity: 1, y: 0, backgroundColor: 'transparent' }}
                                transition={{ duration: 0.5 }}
                                className={cn('flex items-center justify-between px-4 py-3 transition-colors', i === 0 && 'bg-gold/5', bid.is_own && 'bg-blue-50 dark:bg-blue-950/20')}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={cn('w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold', i === 0 ? 'bg-gold text-gold-foreground' : 'bg-secondary text-foreground')}>{i + 1}</div>
                                  <div className="min-w-0">
                                    <p className={cn('text-sm font-medium truncate', bid.is_own && 'text-blue-600 dark:text-blue-400')}>{bid.bidder_name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{new Date(bid.created_at).toLocaleString()}</p>
                                  </div>
                                </div>
                                <p className={cn('text-sm shrink-0 font-bold tabular-nums', i === 0 ? 'text-gold' : 'text-foreground')}>{formatCurrency(bid.amount)}</p>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          {hasMoreBids && (
                            <div className="p-3 text-center border-t">
                              <Button variant="ghost" size="sm" onClick={loadMoreBids} className="text-xs">
                                Load More Bids
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Bid Chart */}
                <TabsContent value="chart" className="mt-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Bid Progression</CardTitle></CardHeader>
                    <CardContent>
                      {bidChartData.length < 2 ? (
                        <div className="text-center py-10 text-muted-foreground text-sm">Not enough bids to show chart yet.</div>
                      ) : (
                        <ResponsiveContainer width="100%" height={220}>
                          <AreaChart data={bidChartData}>
                            <defs>
                              <linearGradient id="bidAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(38,80%,45%)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(38,80%,45%)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="bid" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} label={{ value: 'Bid #', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [formatCurrency(v), 'Bid Amount']} />
                            <Area type="monotone" dataKey="amount" stroke="hsl(38,80%,45%)" strokeWidth={2} fill="url(#bidAreaGrad)" dot={{ r: 3, fill: 'hsl(38,80%,45%)' }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* RIGHT: Bidding Panel */}
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-balance leading-tight">{auction.title}</h1>
                {auction.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{auction.description}</p>}
              </div>

              {/* Countdown */}
              {isActive && auction.end_time && (
                <div className="p-4 bg-secondary/50 rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Time Remaining</p>
                  <Countdown endTime={auction.end_time} />
                </div>
              )}

              {/* Current bid card */}
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div id="current-bid-display" className="flex items-start justify-between transition-colors rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Bid</p>
                      <p className="text-4xl font-bold tabular-nums mt-0.5">{formatCurrency(effectiveBid)}</p>
                      {bids.length > 0 && <p className="text-xs text-muted-foreground mt-1">{bids[0].bidder_name} is leading</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Starting</p>
                      <p className="text-sm font-medium mt-0.5">{formatCurrency(auction.starting_bid)}</p>
                    </div>
                  </div>

                  {auction.reserve_price && (
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span className="flex items-center gap-1"><Shield className="w-3 h-3" />Reserve price progress</span>
                        <span className={reserveMet ? 'text-success font-medium' : ''}>{Math.round(progressPercent)}%</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                      {reserveMet && <p className="text-xs text-success mt-1 flex items-center gap-1"><Check className="w-3 h-3" />Reserve price met</p>}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{bids.length} bids</span>
                    <Separator orientation="vertical" className="h-3" />
                    <span>Min. increment: {formatCurrency(bidIncrement)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Deposit requirement */}
              {isActive && !hasDeposit && auction.deposit_amount && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl">
                  <Banknote className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Deposit Required</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">A refundable deposit of {formatCurrency(auction.deposit_amount)} is required to participate in this auction.</p>
                    <Button size="sm" className="mt-2 h-7 text-xs" onClick={() => setDepositOpen(true)}>Submit Deposit</Button>
                  </div>
                </div>
              )}
              {isActive && hasDeposit && (
                <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded-xl text-sm text-success">
                  <Check className="w-4 h-4 shrink-0" />Deposit submitted — you can bid freely
                </div>
              )}

              {/* Bid input */}
              {isActive && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Your Bid — minimum {formatCurrency(minBid)}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)}
                        placeholder={String(minBid)} className="h-11 text-base flex-1 font-semibold" min={minBid} step={bidIncrement}
                        onKeyDown={e => e.key === 'Enter' && placeBid()}
                      />
                      <Button onClick={placeBid} disabled={placing} className="h-11 px-5 shrink-0 animate-pulse-glow">
                        {placing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Gavel className="w-4 h-4 mr-2" />Bid</>}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      {[minBid, minBid + bidIncrement, minBid + bidIncrement * 2].map(amt => (
                        <button key={amt} onClick={() => setBidAmount(String(amt))}
                          className="flex-1 text-xs border border-border rounded-lg py-1.5 hover:bg-secondary hover:border-gold/30 transition-colors text-muted-foreground hover:text-foreground">
                          {formatCurrency(amt)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={() => setProxyOpen(true)} className="text-xs gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-gold" />Auto-Bid (Proxy)
                    </Button>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Shield className="w-3 h-3" />256-bit secured</span>
                  </div>
                </div>
              )}

              {!isActive && (
                <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl border border-border">
                  <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{auction.status === 'ended' ? 'Auction has ended' : auction.status === 'scheduled' ? 'Auction not started yet' : 'Bidding closed'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{auction.status === 'scheduled' ? `Opens ${formatDate(auction.start_time)}` : `Ended ${formatDate(auction.end_time)}`}</p>
                  </div>
                </div>
              )}

              {/* Auction meta */}
              <div className="grid grid-cols-2 gap-3 text-sm border border-border rounded-xl p-4">
                {[
                  { label: 'Auction #', value: `#${id?.slice(0, 8).toUpperCase()}` },
                  { label: 'Starts', value: formatDate(auction.start_time) },
                  { label: 'Ends', value: formatDate(auction.end_time) },
                  { label: 'Increment', value: formatCurrency(bidIncrement) },
                  ...(auction.deposit_amount ? [{ label: 'Deposit', value: formatCurrency(auction.deposit_amount) }] : []),
                  ...(auction.reserve_price ? [{ label: 'Reserve', value: reserveMet ? '✓ Met' : 'Not met' }] : []),
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Watchlist + notify */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={toggleWatchlist} disabled={watchlistLoading}>
                  <Heart className={cn('w-4 h-4', isWatchlisted && 'fill-destructive text-destructive')} />
                  {isWatchlisted ? 'Watchlisted' : 'Add to Watchlist'}
                </Button>
                <Button variant="outline" size="icon" onClick={shareAuction} title="Share"><Share2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white"><X className="w-6 h-6" /></button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors" onClick={e => { e.stopPropagation(); setCurrentImage(i => (i - 1 + images.length) % images.length); }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <img src={images[currentImage]} alt="" className="max-w-[90vw] max-h-[88vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors" onClick={e => { e.stopPropagation(); setCurrentImage(i => (i + 1) % images.length); }}>
            <ChevronRight className="w-5 h-5" />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">{currentImage + 1} / {images.length}</p>
        </div>
      )}

      {/* Proxy Bid Dialog */}
      <Dialog open={proxyOpen} onOpenChange={setProxyOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Bot className="w-4 h-4 text-gold" />Set Proxy Bid</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">Our AI auto-bidder will incrementally bid on your behalf up to your maximum, ensuring you never miss a beat.</p>
            <div className="space-y-1.5">
              <Label className="text-xs">Maximum Bid Amount</Label>
              <Input type="number" value={proxyAmount} onChange={e => setProxyAmount(e.target.value)} placeholder={`Above ${formatCurrency(minBid)}`} className="h-10" min={minBid} />
            </div>
            <div className="bg-gold/8 border border-gold/20 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">How it works:</p>
              <p>• We place the minimum required bid each time you're outbid</p>
              <p>• You'll be notified if your max is exceeded</p>
              <p>• You can update or cancel at any time</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setProxyOpen(false)}><X className="w-4 h-4 mr-1" />Cancel</Button>
            <Button size="sm" onClick={setProxyBid} disabled={settingProxy}>
              {settingProxy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}Activate Proxy Bid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deposit Dialog */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Banknote className="w-4 h-4 text-gold" />Submit Refundable Deposit</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">A deposit of <strong>{formatCurrency(auction.deposit_amount || 50000)}</strong> is required to participate. This is fully refundable if you don't win.</p>
            <div className="bg-secondary rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Deposit amount</span><span className="font-semibold">{formatCurrency(auction.deposit_amount || 50000)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Refundable</span><span className="text-success font-medium">Yes, 100%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Processing</span><span>1-2 business days</span></div>
            </div>
            <p className="text-xs text-muted-foreground">Our team will contact you with payment instructions within 24 hours of submission.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDepositOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={submitDeposit} disabled={depositSubmitting}>
              {depositSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}Submit Deposit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
