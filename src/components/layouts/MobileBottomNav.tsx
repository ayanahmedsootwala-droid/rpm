import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Car, Gavel, User, Menu, Scale, Sun, Moon, Globe, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage, LANG_FLAGS, LANG_FULL_LABELS } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useCompare } from '@/contexts/CompareContext';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import type { Language } from '@/types/types';

function useDarkMode() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);
  return { dark, toggle };
}

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();
  const { getSetting } = useSiteSettings();
  const { compareList } = useCompare();
  const { user } = useAuth();
  const { dark, toggle: toggleDark } = useDarkMode();
  const [mobileOpen, setMobileOpen] = useState(false);

  const auctionsOn = getSetting('auctions_feature_enabled', 'true') !== 'false';
  const findMyCarOn = getSetting('find_my_car_enabled', 'true') !== 'false';

  const navItems = [
    { key: 'home', href: '/', icon: Home },
    { key: 'inventory', href: '/inventory', icon: Car },
  ];

  if (auctionsOn) {
    navItems.push({ key: 'auctions', href: '/auctions', icon: Gavel });
  }

  navItems.push({ key: 'dashboard', href: '/dashboard', icon: User });

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-lg border-t border-border pb-safe">
      <div className="flex items-center justify-around px-2 h-16">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.key}
              to={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                'relative flex items-center justify-center transition-all duration-300',
                active ? '-translate-y-1' : ''
              )}>
                {active && (
                  <span className="absolute inset-0 bg-primary/10 rounded-full scale-150 animate-pulse-glow" />
                )}
                <item.icon className={cn('w-5 h-5 transition-all duration-300', active ? 'scale-110' : '')} />
              </div>
              <span className={cn(
                'text-[10px] font-medium transition-all duration-300',
                active ? 'opacity-100 font-semibold' : 'opacity-70'
              )}>
                {t(item.key)}
              </span>
              {active && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}

        {/* More Menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button className="relative flex flex-col items-center justify-center w-full h-full gap-1 text-muted-foreground hover:text-foreground transition-all duration-300">
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-medium opacity-70">{t('more')}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl px-0 pb-0 pt-4 flex flex-col bg-background/95 backdrop-blur-xl">
            <div className="flex items-center justify-between px-6 pb-4 border-b border-border">
              <h3 className="font-semibold text-lg">{t('menu')}</h3>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Compare */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Tools</p>
                <Link
                  to={compareList.length >= 2 ? `/compare?ids=${compareList.map(c => c.id).join(',')}` : '/compare'}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50 shadow-sm active:scale-95 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Scale className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-sm">Compare Vehicles</span>
                  </div>
                  {compareList.length > 0 && (
                    <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-semibold">
                      {compareList.length}
                    </span>
                  )}
                </Link>
                <Link
                  to="/sell"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center p-3 rounded-xl bg-card border border-border/50 shadow-sm active:scale-95 transition-all gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Car className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-sm">{t('sellYourCar')}</span>
                </Link>
                {findMyCarOn && (
                  <Link
                    to="/find-my-car"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center p-3 rounded-xl bg-card border border-border/50 shadow-sm active:scale-95 transition-all gap-3"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Search className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-sm">{t('find_my_car')}</span>
                  </Link>
                )}
              </div>

              {/* Preferences */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Preferences</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={toggleDark} className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border/50 shadow-sm active:scale-95 transition-all gap-2">
                    {dark ? <Sun className="w-6 h-6 text-gold" /> : <Moon className="w-6 h-6 text-primary" />}
                    <span className="text-xs font-medium">{dark ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
                  <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border/50 shadow-sm gap-2">
                    <Globe className="w-6 h-6 text-primary" />
                    <div className="flex items-center gap-2 mt-1">
                      {(['en','ur'] as Language[]).map(l => (
                        <button key={l} onClick={() => setLang(l)} className={cn(
                          'px-2 py-1 rounded text-xs font-medium transition-all',
                          lang === l ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted'
                        )}>
                          {LANG_FLAGS[l]} {l.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Account */}
              {!user && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Account</p>
                  <div className="flex flex-col gap-2">
                    <Button className="w-full h-12 rounded-xl" onClick={() => { navigate('/login'); setMobileOpen(false); }}>
                      {t('login')}
                    </Button>
                    <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => { navigate('/register'); setMobileOpen(false); }}>
                      {t('register')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}