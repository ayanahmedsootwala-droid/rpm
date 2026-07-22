import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Fuel, Gauge, Settings, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCompare } from '@/contexts/CompareContext';
import { supabase } from '@/db/supabase';
import { formatCurrency, formatMileage } from '@/lib/utils-xyz';
import type { Car } from '@/types/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface CarCardProps {
  car: Car;
  wishlistedIds?: Set<string>;
  onWishlistToggle?: (carId: string, added: boolean) => void;
  viewMode?: 'grid' | 'list';
}

export function CarCard({ car, wishlistedIds, onWishlistToggle }: CarCardProps) {
  const { user } = useAuth();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const [wishlisted, setWishlisted] = useState(wishlistedIds?.has(car.id) ?? false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const mainImage = Array.isArray(car.images) && car.images.length > 0 ? car.images[0] : null;
  const inCompare = isInCompare(car.id);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to save cars'); return; }
    setWishlistLoading(true);
    if (wishlisted) {
      await supabase.from('wishlist').delete().eq('user_id', user.id).eq('car_id', car.id);
      setWishlisted(false);
      onWishlistToggle?.(car.id, false);
    } else {
      await supabase.from('wishlist').insert({ user_id: user.id, car_id: car.id });
      setWishlisted(true);
      onWishlistToggle?.(car.id, true);
    }
    setWishlistLoading(false);
  };

  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inCompare) {
      removeFromCompare(car.id);
      toast.info('Removed from comparison');
    } else {
      const added = addToCompare(car);
      if (!added) toast.error('You can compare up to 3 cars at a time');
      else toast.success('Added to comparison');
    }
  };

  return (
    <Link to={`/car/${car.id}`} className="block group h-full">
      <div className="luxury-card h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-200">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {mainImage ? (
            <img src={mainImage} alt={car.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" /></svg>
            </div>
          )}

          {/* Status badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            {car.status === 'sold' && <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0">Sold</Badge>}
            {car.status === 'reserved' && <Badge className="bg-warning text-warning-foreground text-[10px] px-1.5 py-0">Reserved</Badge>}
            {car.is_featured && car.status === 'active' && <Badge className="bg-gold text-gold-foreground text-[10px] px-1.5 py-0">Featured</Badge>}
          </div>

          {/* Action overlay */}
          <div className="absolute top-2 right-2 flex gap-1">
            <button onClick={toggleCompare} title={inCompare ? 'Remove from compare' : 'Compare'}
              className={cn('w-7 h-7 rounded-sm flex items-center justify-center transition-colors backdrop-blur-sm',
                inCompare ? 'bg-primary text-primary-foreground' : 'bg-background/80 text-foreground hover:bg-background')}>
              <Scale className="w-3.5 h-3.5" />
            </button>
            <button onClick={toggleWishlist} disabled={wishlistLoading} title={wishlisted ? 'Remove from wishlist' : 'Save'}
              className={cn('w-7 h-7 rounded-sm flex items-center justify-center transition-colors backdrop-blur-sm',
                wishlisted ? 'bg-destructive text-destructive-foreground' : 'bg-background/80 text-foreground hover:bg-background')}>
              <Heart className={cn('w-3.5 h-3.5', wishlisted && 'fill-current')} />
            </button>
          </div>

          {/* Remove views badge entirely */}
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 p-4">
          <div className="mb-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {car.brand_name || 'Unknown'} · {car.year}{car.registration_year ? ` / Reg. ${car.registration_year}` : ''}
            </p>
            <h3 className="font-semibold text-foreground text-sm mt-0.5 leading-snug line-clamp-1">
              {car.model_name || car.title}
            </h3>
            {car.variant_name && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{car.variant_name}</p>
            )}
          </div>

          {/* Specs row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            {car.mileage != null && (
              <span className="flex items-center gap-1"><Gauge className="w-3 h-3" />{formatMileage(car.mileage)}</span>
            )}
            {car.fuel_type && (
              <span className="flex items-center gap-1"><Fuel className="w-3 h-3" />{car.fuel_type}</span>
            )}
            {car.transmission && (
              <span className="flex items-center gap-1"><Settings className="w-3 h-3" />{car.transmission}</span>
            )}
          </div>

          {/* Price & Location */}
          <div className="mt-auto flex items-end justify-between gap-2">
            <div>
              <p className="text-base font-bold text-foreground">{formatCurrency(car.price)}</p>
              {car.is_negotiable && <p className="text-[10px] text-muted-foreground">Negotiable</p>}
            </div>
            {(car.registration_city || car.location) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[80px]">{car.registration_city || car.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
