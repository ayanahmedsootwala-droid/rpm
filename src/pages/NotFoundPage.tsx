import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Car, Search, Home, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotFoundPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center hero-mesh-bg">
      {/* Animated orbs */}
      <div className="orb-gold" style={{ width: 300, height: 300, top: '10%', left: '5%', opacity: 0.12 }} />
      <div className="orb-blue" style={{ width: 200, height: 200, bottom: '20%', right: '10%', opacity: 0.10 }} />

      <div className="relative z-10 max-w-md">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center mb-8 shadow-2xl">
          <Car className="w-10 h-10 text-white/80" />
        </div>

        {/* Error code */}
        <div className="relative mb-4">
          <p className="text-8xl font-black text-white/5 select-none absolute inset-0 flex items-center justify-center">404</p>
          <p className="text-7xl font-black text-white/90 leading-none tracking-tight relative">404</p>
        </div>

        <h1 className="text-xl font-semibold text-white/90 mb-2">Page Not Found</h1>
        <p className="text-sm text-white/50 mb-10 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="h-10 gap-2 bg-white text-gray-900 hover:bg-white/90 font-medium">
            <Link to="/"><Home className="w-4 h-4" /> Go Home</Link>
          </Button>
          <Button variant="ghost" asChild className="h-10 gap-2 border border-white/20 text-white hover:bg-white/10">
            <Link to="/inventory"><Search className="w-4 h-4" /> Browse Cars</Link>
          </Button>
          <Button variant="ghost" asChild className="h-10 gap-2 border border-white/20 text-white hover:bg-white/10">
            <Link to="/auctions"><ArrowLeft className="w-4 h-4" /> Live Auctions</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
