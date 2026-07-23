import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ChevronLeft, ChevronRight, Heart, Scale, Share2, MapPin, Fuel,
  Settings, Gauge, Calendar, Car as CarIcon, Check, MessageSquare,
  Building2, X, ZoomIn, Loader2, Star, ExternalLink, Phone, Calculator, FileText, AlertTriangle, Truck
} from 'lucide-react';
import { ZoomableLightbox } from '@/components/cars/ZoomableLightbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { CarCard } from '@/components/cars/CarCard';
import { useCar, useCars } from '@/hooks/useCars';
import { useAuth } from '@/contexts/AuthContext';
import { useCompare } from '@/contexts/CompareContext';
import { supabase } from '@/db/supabase';
import { formatCurrency, formatMileage, formatDate, getStatusColor } from '@/lib/utils-xyz';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import AiSpecsAssistant from '@/components/ai/AiSpecsAssistant';
import { cn } from '@/lib/utils';


export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { car, loading } = useCar(id!);
  const { user, profile } = useAuth();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { t } = useLanguage();
  const { getSetting } = useSiteSettings();
  const navigate = useNavigate();

  const [currentImage, setCurrentImage] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  // Related cars (same brand/body type, different id)
  const { cars: relatedCars } = useCars({
    status: 'active',
    brand_id: car?.brand_id ?? undefined,
    limit: 4,
  });
  const filteredRelated = relatedCars.filter(c => c.id !== id).slice(0, 3);

  useEffect(() => {
    if (user && id) {
      supabase.from('wishlist').select('id').eq('user_id', user.id).eq('car_id', id).maybeSingle()
        .then(({ data }) => setWishlisted(!!data));
    }
  }, [user, id]);

  useEffect(() => {
    if (profile) setInquiryForm(f => ({ ...f, name: profile.full_name || '', email: profile.email || '' }));
  }, [profile]);

  const toggleWishlist = async () => {
    if (!user) { navigate('/login'); return; }
    if (wishlisted) {
      await supabase.from('wishlist').delete().eq('user_id', user.id).eq('car_id', id);
      setWishlisted(false); toast.success('Removed from wishlist');
    } else {
      await supabase.from('wishlist').insert({ user_id: user.id, car_id: id });
      setWishlisted(true); toast.success('Added to wishlist');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: `${car?.brand_name} ${car?.model_name}`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied');
    }
  };

  const submitInquiry = async () => {
    if (!inquiryForm.name || !inquiryForm.email || !inquiryForm.message) {
      toast.error('Please fill all required fields'); return;
    }
    setSubmittingInquiry(true);
    try {
      const { error } = await supabase.from('inquiries').insert({
        car_id: id, user_id: user?.id,
        dealership_id: car?.dealership_id || null,
        name: inquiryForm.name, email: inquiryForm.email,
        phone: inquiryForm.phone || null, message: inquiryForm.message,
      });
      if (error) throw error;
      toast.success('Inquiry sent! The seller will contact you shortly.');
      setInquiryOpen(false);
    } catch (e: any) { 
      console.error(e);
      toast.error('Failed to send inquiry: ' + (e.message || 'Unknown error')); 
    }
    finally { setSubmittingInquiry(false); }
  };

  const images = car?.images?.length ? car.images : ['/placeholder-car.jpg'];
  const inCompare = car ? isInCompare(car.id) : false;

  /* ── Loading skeleton ─────────────────────── */
  if (loading) return (
    <PublicLayout>
      <div className="pt-[68px] max-w-7xl mx-auto px-4 md:px-6 py-10">
        <Skeleton className="h-3.5 w-48 mb-8 bg-muted" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
          <div className="space-y-3">
            <Skeleton className="aspect-[4/3] w-full rounded-xl bg-muted" />
            <div className="flex gap-2">
              {[1,2,3,4].map(i => <Skeleton key={i} className="w-16 h-16 rounded-lg bg-muted" />)}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-7 w-3/4 bg-muted" />
            <Skeleton className="h-8 w-1/2 bg-muted" />
            <Skeleton className="h-4 w-full bg-muted" />
            <Skeleton className="h-32 w-full rounded-xl bg-muted" />
            <Skeleton className="h-10 w-full rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    </PublicLayout>
  );

  if (!car) return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <CarIcon className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Vehicle not found.</p>
        <Button variant="ghost" size="sm" onClick={() => navigate('/inventory')} className="mt-4 gap-1.5">
          <ChevronLeft className="w-4 h-4" /> Back to Inventory
        </Button>
      </div>
    </PublicLayout>
  );

  // Contact details — uses site brand name + settings, or dealer contact if admin set show_contact_type = 'dealer'
  const contactType = car?.show_contact_type || 'admin';
  const siteName = getSetting('site_name', 'XYZ Automobiles');
  const adminPhone = getSetting('contact_phone', '+92 300 1234567');
  const adminEmail = getSetting('contact_email', '');
  const adminWhatsapp = getSetting('whatsapp_number', '+923001234567').replace(/\s+/g, '');

  const dealershipData = car?.dealership;
  const dealerPhone = dealershipData?.phone || adminPhone;
  const dealerEmail = dealershipData?.email || '';
  const dealerName  = dealershipData?.name  || car?.dealership_name || siteName;

  const displayPhone = contactType === 'dealer' && car?.dealership_id ? dealerPhone : adminPhone;
  const displayEmail = contactType === 'dealer' && car?.dealership_id ? dealerEmail : adminEmail;
  const displayName  = contactType === 'dealer' && car?.dealership_id ? dealerName  : siteName;
  const whatsappNumber = (contactType === 'dealer' && car?.dealership_id ? dealerPhone : adminWhatsapp).replace(/[^\d+]/g, '');
  const whatsappMsg = encodeURIComponent(
    `Hi, I'm interested in the ${car.year} ${car.brand_name} ${car.model_name} for ${formatCurrency(car.price)}. Listing: ${window.location.href}`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMsg}`;

  return (
    <PublicLayout>
      <Helmet>
        <title>{`${car.year} ${car.brand_name} ${car.model_name} — ${formatCurrency(car.price)} | XYZ Automobiles`}</title>
        <meta name="description" content={car.description || `${car.year} ${car.brand_name} ${car.model_name}, ${car.mileage?.toLocaleString()} km, ${car.city}. Available at XYZ Automobiles.`} />
        <meta property="og:title" content={`${car.year} ${car.brand_name} ${car.model_name}`} />
        <meta property="og:image" content={images[0]} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="product" />
      </Helmet>

      <div className="pt-[68px] min-h-screen">
        {/* Breadcrumb */}
        <div className="border-b border-border/20 section-bg-dark-premium">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">{t('home')}</Link>
              <ChevronRight className="w-3 h-3" />
              <Link to="/inventory" className="hover:text-foreground transition-colors">{t('inventory')}</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground truncate max-w-[200px]">{car.year} {car.brand_name} {car.model_name}</span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 lg:gap-12 items-start">

            {/* Left — Gallery + Tabs */}
            <div className="space-y-8 min-w-0">
              {/* Gallery */}
              <div className="space-y-2">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted group cursor-pointer"
                  onClick={() => setLightbox(true)}>
                  <img src={images[currentImage]} alt={`${car.brand_name} ${car.model_name}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/12 transition-colors duration-200 flex items-center justify-center">
                    <div className="bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="w-5 h-5" />
                    </div>
                  </div>
                  {/* Nav arrows */}
                  {images.length > 1 && <>
                    <button onClick={e => { e.stopPropagation(); setCurrentImage(i => (i - 1 + images.length) % images.length); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setCurrentImage(i => (i + 1) % images.length); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>}
                  {/* Counter + status */}
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                    {currentImage + 1}/{images.length}
                  </div>
                  <Badge className={cn('absolute top-3 left-3 text-xs capitalize', getStatusColor(car.status))}>
                    {car.status}
                  </Badge>
                </div>
                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((img, i) => (
                      <button key={i} onClick={() => setCurrentImage(i)}
                        className={cn('shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all',
                          i === currentImage ? 'border-foreground' : 'border-transparent opacity-50 hover:opacity-80')}>
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tabs */}
              <Tabs defaultValue="description">
                <TabsList className="border-b border-border bg-transparent rounded-none w-full justify-start h-auto pb-0 gap-0 overflow-x-auto whitespace-nowrap">
                  {['description', 'specs', 'reports', 'seller'].map(tab => (
                    <TabsTrigger key={tab} value={tab}
                      className="capitalize text-sm pb-3 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent text-muted-foreground">
                      {tab === 'seller' ? 'Seller Info' : tab === 'reports' ? 'Why RPM?' : tab}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="description" className="pt-6">
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line text-pretty">
                    {car.description || 'No description provided for this vehicle.'}
                  </p>
                  {/* Features list */}
                  {car.features && Array.isArray(car.features) && car.features.length > 0 && (
                    <div className="mt-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Features</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(car.features as string[]).map((f: string) => (
                          <div key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                            <Check className="w-3.5 h-3.5 text-[hsl(var(--gold))] shrink-0" />
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="specs" className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-0">
                    {[
                      { label: 'Make',          value: car.brand_name },
                      { label: 'Model',         value: car.model_name },
                      { label: 'Year',          value: car.year },
                      { label: 'Reg. Year',     value: car.registration_year ?? '—' },
                      { label: 'Mileage',       value: formatMileage(car.mileage) },
                      { label: 'Fuel Type',     value: car.fuel_type },
                      { label: 'Transmission',  value: car.transmission },
                      { label: 'Body Type',     value: car.body_type },
                      { label: 'Engine',        value: car.engine_capacity ? `${car.engine_capacity}cc` : 'N/A' },
                      { label: 'Color',         value: car.color },
                      { label: 'Condition',     value: car.condition },
                      { label: 'City',          value: car.city },
                      { label: 'Listed',        value: formatDate(car.created_at) },
                    ].map(spec => (
                      <div key={spec.label} className="flex items-center justify-between py-2.5 border-b border-border/40">
                        <span className="text-xs text-muted-foreground">{spec.label}</span>
                        <span className="text-xs font-medium text-right max-w-[130px] truncate">{spec.value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="reports" className="pt-6">
                  <div className="space-y-4">
                    {/* VIN Check */}
                    <div className="flex items-start gap-4 p-5 border border-border rounded-xl">
                      <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center shrink-0">
                        <Check className="w-5 h-5 text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">RPM Certified</p>
                        <p className="text-xs text-muted-foreground mt-1">Professionally inspected and approved to meet RPM Motors' quality standards.</p>
                      </div>
                    </div>
                    {/* Inspection */}
                    <div className="flex items-start gap-4 p-5 border border-border rounded-xl">
                      <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center shrink-0">
                        <Check className="w-5 h-5 text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">Trust & Verification</p>
                        <p className="text-xs text-muted-foreground mt-1">Ownership, documentation and vehicle details verified for complete peace of mind.</p>
                      </div>
                    </div>
                    {/* Damage */}
                    <div className="flex items-start gap-4 p-5 border border-border rounded-xl">
                      <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center shrink-0">
                        <Check className="w-5 h-5 text-success" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">Ready for Delivery</p>
                        <p className="text-xs text-muted-foreground mt-1">Fully prepared, professionally detailed, and ready to drive home today.</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="seller" className="pt-6">
                  {car.dealership_id ? (
                    <div className="flex items-start gap-4 p-5 border border-border rounded-xl">
                      <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{car.dealership_name || 'Dealership'}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Check className="w-3 h-3 text-success" />
                          <span className="text-xs text-muted-foreground">Verified Dealership Partner</span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="ghost" className="border border-border h-8 text-xs" asChild>
                            <Link to={`/dealer/${car.dealership_id}`}>
                              View Profile <ExternalLink className="w-3 h-3 ml-1" />
                            </Link>
                          </Button>
                          <Button size="sm" className="h-8 text-xs" onClick={() => setInquiryOpen(true)}>
                            Contact Dealer
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Seller Information</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Right — Sticky action panel */}
            <div className="space-y-4 lg:sticky lg:top-20">
              {/* Title + actions row */}
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight text-balance leading-tight">
                    {car.year} {car.brand_name} {car.model_name}
                  </h1>
                  {car.variant_name && (
                    <p className="text-muted-foreground text-sm mt-0.5">{car.variant_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button variant="ghost" size="icon" onClick={toggleWishlist}
                    className="w-8 h-8 text-muted-foreground hover:text-foreground">
                    <Heart className={cn('w-4 h-4', wishlisted ? 'fill-destructive text-destructive' : '')} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleShare}
                    className="w-8 h-8 text-muted-foreground hover:text-foreground">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon"
                    onClick={() => inCompare ? removeFromCompare(car.id) : addToCompare(car)}
                    className={cn('w-8 h-8 text-muted-foreground hover:text-foreground', inCompare && 'text-foreground bg-secondary')}>
                    <Scale className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Price block */}
              <div className="p-4 border border-border rounded-xl space-y-3">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Asking Price</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">{formatCurrency(car.price)}</p>
                </div>


                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{car.city}, Pakistan</span>
                  {car.dealership_name && (
                    <>
                      <span className="text-border">·</span>
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <Link to={`/dealer/${car.dealership_id}`} className="hover:text-foreground transition-colors truncate flex items-center gap-0.5">
                        {car.dealership_name}
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Quick spec pills */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Calendar, label: 'Model Year', value: String(car.year) },
                  ...(car.registration_year ? [{ icon: Calendar, label: 'Reg. Year', value: String(car.registration_year) }] : []),
                  { icon: Gauge,    label: 'Mileage',    value: formatMileage(car.mileage) },
                  { icon: Fuel,     label: 'Fuel',       value: car.fuel_type || '—' },
                  { icon: Settings, label: 'Trans.',     value: car.transmission || '—' },
                  { icon: CarIcon,  label: 'Body',       value: car.body_type || '—' },
                  { icon: Star,     label: 'Condition',  value: car.condition || '—' },
                ].map(spec => (
                  <div key={spec.label} className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-secondary/60 border border-border/50 text-center">
                    <spec.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{spec.label}</span>
                    <span className="text-[11px] font-medium truncate w-full text-center">{spec.value}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-col gap-2">
                {/* Contact card */}
                <div className="flex flex-col gap-1.5 px-3 py-2.5 rounded-lg bg-secondary/50 border border-border/50">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <p className="text-xs font-semibold truncate">{displayName}</p>
                  </div>
                  <div className="flex items-center gap-2 justify-between">
                    <p className="text-xs text-muted-foreground truncate">{displayPhone}</p>
                    <a href={`tel:${displayPhone.replace(/\s+/g,'')}`}
                      className="shrink-0 text-primary hover:text-primary/80 transition-colors">
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                  {displayEmail ? (
                    <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                  ) : null}
                </div>
                <Button onClick={() => setInquiryOpen(true)} className="h-10 font-medium gap-2">
                  <MessageSquare className="w-4 h-4" /> Send Inquiry
                </Button>
                <Button variant="outline" className="h-10 font-medium gap-2" asChild>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <MessageSquare className="w-4 h-4 text-green-600" /> WhatsApp
                  </a>
                </Button>
                <Button variant="ghost" className="h-9 text-sm border border-border gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => inCompare ? removeFromCompare(car.id) : addToCompare(car)}>
                  <Scale className="w-4 h-4" />
                  {inCompare ? 'Remove from Compare' : 'Add to Compare'}
                </Button>
              </div>

              {/* Safety note */}
              <div className="flex items-start gap-2 p-3 bg-secondary/50 rounded-lg border border-border/50">
                <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  This listing has been reviewed by our team. Always meet in a safe location and verify documents before payment.
                </p>
              </div>

              {/* AI Specs Assistant */}
              {getSetting('ai_specs_assistant_enabled', 'true') !== 'false' && (
                <AiSpecsAssistant car={car} />
              )}
            </div>
          </div>

          {/* Related Cars */}
          {filteredRelated.length > 0 && getSetting('ai_similar_cars_enabled', 'true') !== 'false' && (
            <div className="mt-14 pt-10 border-t border-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">Similar Vehicles</h2>
                  <span className="text-[10px] text-muted-foreground border border-border/50 rounded-full px-2 py-0.5">AI Matched</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/inventory?brand_id=${car.brand_id}`)}
                  className="text-xs text-muted-foreground hover:text-foreground gap-1">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {filteredRelated.map(rc => <CarCard key={rc.id} car={rc} />)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zoomable Lightbox */}
      {lightbox && (
        <ZoomableLightbox
          images={images}
          initialIndex={currentImage}
          onClose={() => setLightbox(false)}
        />
      )}

      {/* Inquiry Dialog */}
      <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Inquiry</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="p-3 bg-secondary/50 rounded-lg border border-border/50 text-xs text-muted-foreground">
              Inquiring about: <span className="font-medium text-foreground">{car.year} {car.brand_name} {car.model_name}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-normal text-muted-foreground mb-1.5 block">Full Name *</Label>
                <Input value={inquiryForm.name} onChange={e => setInquiryForm(f => ({ ...f, name: e.target.value }))} className="h-9 text-sm" placeholder="Your name" />
              </div>
              <div>
                <Label className="text-xs font-normal text-muted-foreground mb-1.5 block">Email *</Label>
                <Input type="email" value={inquiryForm.email} onChange={e => setInquiryForm(f => ({ ...f, email: e.target.value }))} className="h-9 text-sm" placeholder="your@email.com" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-normal text-muted-foreground mb-1.5 block">Phone (optional)</Label>
              <Input value={inquiryForm.phone} onChange={e => setInquiryForm(f => ({ ...f, phone: e.target.value }))} placeholder="+92 300 0000000" className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-normal text-muted-foreground mb-1.5 block">Message *</Label>
              <Textarea value={inquiryForm.message} onChange={e => setInquiryForm(f => ({ ...f, message: e.target.value }))}
                placeholder={`I'm interested in this ${car.brand_name} ${car.model_name}. Could you provide more details?`}
                className="text-sm min-h-[80px] resize-none" />
            </div>
            <Button onClick={submitInquiry} disabled={submittingInquiry} className="w-full h-10">
              {submittingInquiry
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
                : <><Check className="w-4 h-4 mr-2" /> Send Inquiry</>
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
