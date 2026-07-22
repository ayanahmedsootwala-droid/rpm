import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Gavel, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatCountdown } from '@/lib/utils-xyz';
import type { Auction } from '@/types/types';

interface AuctionCardProps {
  auction: Auction;
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const [countdown, setCountdown] = useState(formatCountdown(auction.end_time));
  const car = auction.car;

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(formatCountdown(auction.end_time));
    }, 1000);
    return () => clearInterval(interval);
  }, [auction.end_time]);

  const mainImage = Array.isArray(car?.images) && car.images.length > 0 ? car.images[0] : null;

  const statusColor = auction.status === 'active'
    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    : auction.status === 'scheduled'
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      : 'bg-muted text-muted-foreground';

  return (
    <Link to={`/auction/${auction.id}`} className="block group h-full">
      <div className="luxury-card h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-200">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {mainImage ? (
            <img src={mainImage} alt={auction.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
              <Gavel className="w-10 h-10" />
            </div>
          )}
          <div className="absolute top-2 left-2">
            <Badge className={`text-[10px] px-1.5 py-0 capitalize ${statusColor}`}>{auction.status}</Badge>
          </div>
          {auction.status === 'active' && !countdown.isEnded && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <div className="flex items-center gap-1.5 text-white text-xs">
                <Clock className="w-3 h-3 shrink-0" />
                <span className="font-mono">
                  {countdown.days > 0 && `${countdown.days}d `}
                  {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
            {car?.brand_name || 'Vehicle'} · {car?.year}
          </p>
          <h3 className="font-semibold text-sm text-foreground line-clamp-1 mb-3">{auction.title}</h3>

          <div className="flex items-center justify-between gap-2 mt-auto">
            <div>
              <p className="text-[10px] text-muted-foreground">
                {auction.current_bid ? 'Current Bid' : 'Starting Bid'}
              </p>
              <p className="text-base font-bold text-foreground">
                {formatCurrency(auction.current_bid || auction.starting_bid)}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}
