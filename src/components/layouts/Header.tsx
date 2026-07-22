import { useState, useEffect, useRef, useCallback, useDeferredValue } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, X, Car, ChevronDown, Globe, LogOut, User, LayoutDashboard, Shield,
  Bell, Search, Command, Gavel, BookOpen, Moon, Sun, Check, Building2,
  ArrowRight, Scale, Phone
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, LANG_FLAGS, LANG_FULL_LABELS, LANG_LABELS } from '@/contexts/LanguageContext';
import type { Language } from '@/types/types';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useNotifications } from '@/hooks/useNotifications';
import { useCompare } from '@/contexts/CompareContext';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils-xyz';

const navLinks = [
  { key: 'home',        href: '/' },
  { key: 'inventory',   href: '/inventory' },
  { key: 'auctions',    href: '/auctions' },
  { key: 'sellYourCar', href: '/sell' },
  { key: 'find_my_car', href: '/find-my-car' },
  { key: 'blog',        href: '/blog' },
  { key: 'about_us',    href: '/about' },
  { key: 'contact',     href: '/contact' },
];

const cmdItems = [
  { key: 'inventory',   href: '/inventory',   icon: Car },
  { key: 'auctions',    href: '/auctions',    icon: Gavel },
  { key: 'sellYourCar', href: '/sell',        icon: Car },
  { key: 'blog',        href: '/blog',        icon: BookOpen },
  { key: 'dashboard',   href: '/dashboard',   icon: User },
  { key: 'compare',     href: '/compare',     icon: Car },
];

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

export function Header() {
  const { user, profile, signOut, isAdmin, isDealershipStaff } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { getSetting } = useSiteSettings();
  const auctionsOn = getSetting('auctions_feature_enabled', 'true') !== 'false';
  const findMyCarOn = getSetting('find_my_car_enabled', 'true') !== 'false';
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const { compareList } = useCompare();
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggle: toggleDark } = useDarkMode();
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen]   = useState(false);
  const [cmdOpen, setCmdOpen]       = useState(false);
  const [cmdQuery, setCmdQuery]     = useState('');
  const [carResults, setCarResults] = useState<Array<{id:string; title:string; brand_name:string|null; price:number; year:number}>>([]);
  const [searching, setSearching]   = useState(false);
  const deferredQuery = useDeferredValue(cmdQuery);
  const cmdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(o => !o); }
      if (e.key === 'Escape') { setCmdOpen(false); setNotifOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (cmdOpen) setTimeout(() => cmdInputRef.current?.focus(), 50);
  }, [cmdOpen]);

  useEffect(() => {
    if (!deferredQuery || deferredQuery.length < 2) { setCarResults([]); return; }
    let cancelled = false;
    setSearching(true);
    supabase
      .from('cars')
      .select('id, title, brand_name, price, year')
      .ilike('title', `%${deferredQuery}%`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (!cancelled) {
          setCarResults((data as Array<{id:string;title:string;brand_name:string|null;price:number;year:number}>) || []);
          setSearching(false);
        }
      });
    return () => { cancelled = true; };
  }, [deferredQuery]);

  const siteName = getSetting('site_name', 'XYZ Automobiles');
  const logoUrl = getSetting('site_logo_url', '');
  const heroNavbarPlacement = getSetting('hero_navbar_placement', 'transparent');
  const handleSignOut = async () => { await signOut(); navigate('/'); };
  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);
  const visibleNavLinks = navLinks.filter(l => {
    if (!auctionsOn && l.href === '/auctions') return false;
    if (!findMyCarOn && l.href === '/find-my-car') return false;
    return true;
  });
  const visibleCmdItems = cmdItems.filter(i => {
    if (!auctionsOn && i.href === '/auctions') return false;
    return true;
  });
  const filteredCmd = visibleCmdItems.filter(i =>
    t(i.key).toLowerCase().includes(cmdQuery.toLowerCase())
  );
  const isHomepage = location.pathname === '/';
  
  if (isHomepage && heroNavbarPlacement === 'hidden') {
    return null;
  }

  const isSolid = !isHomepage || heroNavbarPlacement === 'solid' || scrolled;

  // Transparent-header icon colour helpers
  const iconCls = isSolid
    ? 'text-muted-foreground hover:text-foreground'
    : 'text-white/80 hover:text-white';
  const handleCmdSelect = useCallback((href: string) => {
    navigate(href); setCmdOpen(false); setCmdQuery('');
  }, [navigate]);

  return (
    <>
      <header className={cn(
        'top-0 left-0 right-0 z-50 transition-all duration-500 h-16',
        isHomepage && heroNavbarPlacement === 'solid' ? 'sticky' : 'fixed',
        isSolid
          ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-sm'
          : 'bg-transparent'
      )}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full gap-6">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 shrink-0 group">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={siteName}
                  className={cn(
                    'h-9 w-auto object-contain max-w-[130px] transition-all duration-300 group-hover:scale-[1.03]',
                    !isSolid && 'drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]'
                  )}
                />
              ) : (
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-[1.05] shrink-0',
                  isSolid
                    ? 'bg-primary shadow-sm'
                    : 'bg-[hsl(var(--gold))] shadow-[0_0_14px_rgba(196,147,24,0.4)]'
                )}>
                  <Car className={cn("w-4.5 h-4.5", isSolid ? "text-primary-foreground" : "text-black")} />
                </div>
              )}
              <div className="hidden sm:flex flex-col leading-tight">
                <span className={cn(
                  'font-bold tracking-tight text-lg transition-colors duration-300',
                  isSolid ? 'text-foreground' : 'text-white drop-shadow-md'
                )}>
                  {siteName}
                </span>
                <span className={cn(
                  'text-[10px] font-medium tracking-[0.2em] uppercase transition-colors duration-300',
                  isSolid ? 'text-muted-foreground' : 'text-white/70 drop-shadow-sm'
                )}>
                  Premium Autos
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-4 xl:gap-6" aria-label="Main navigation">
              {visibleNavLinks.map(link => (
                <Link key={link.key} to={link.href} className={cn(
                  'relative py-1 text-[13px] font-semibold tracking-tight transition-all duration-200 group whitespace-nowrap',
                  isActive(link.href)
                    ? isSolid
                      ? 'text-foreground'
                      : 'text-white'
                    : isSolid
                      ? 'text-muted-foreground hover:text-foreground'
                      : 'text-white/80 hover:text-white'
                )}>
                  {t(link.key)}
                  <span className={cn(
                    'absolute -bottom-1 left-0 w-full h-[2px] rounded-full transition-all duration-300',
                    isActive(link.href)
                      ? 'bg-[hsl(var(--gold))] scale-x-100'
                      : 'bg-[hsl(var(--gold))] scale-x-0 group-hover:scale-x-100 opacity-50'
                  )} />
                </Link>
              ))}
            </nav>

            {/* Action bar */}
            <div className="flex items-center gap-0.5">

              {/* Call Action */}
              <Button variant="ghost" size="icon" asChild
                className={cn('flex w-8 h-8 rounded-lg relative transition-all duration-200', iconCls)}>
                <a href="tel:+923218284748" aria-label="Call Us">
                  <Phone className="w-[15px] h-[15px]" />
                </a>
              </Button>

              {/* Search pill */}
              <Button variant="ghost" size="sm" onClick={() => setCmdOpen(true)}
                className={cn(
                  'hidden md:flex items-center gap-2 text-xs border rounded-xl px-3 h-8 transition-all duration-200',
                  isSolid
                    ? 'text-muted-foreground hover:text-foreground border-border/50 hover:bg-secondary/80 hover:border-border'
                    : 'text-white/75 hover:text-white border-white/20 hover:bg-white/10 hover:border-white/35'
                )}>
                <Search className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden lg:block">{t('search')}</span>
                <kbd className={cn(
                  'hidden lg:block ml-0.5 text-[10px] px-1.5 py-0.5 rounded-md font-mono',
                  isSolid ? 'bg-muted text-muted-foreground' : 'bg-white/15 text-white/70'
                )}>⌘K</kbd>
              </Button>

              {/* Compare icon */}
              <Button variant="ghost" size="icon" asChild
                className={cn('hidden md:flex w-8 h-8 rounded-lg relative transition-all duration-200', iconCls)}>
                <Link to={compareList.length >= 2 ? `/compare?ids=${compareList.map(c => c.id).join(',')}` : '/compare'}>
                  <Scale className="w-[15px] h-[15px]" />
                  {compareList.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-semibold px-0.5">
                      {compareList.length}
                    </span>
                  )}
                </Link>
              </Button>

              {/* Dark mode */}
              <Button variant="ghost" size="icon" onClick={toggleDark}
                className={cn('w-8 h-8 rounded-lg transition-all duration-200', iconCls)}>
                {dark ? <Sun className="w-[15px] h-[15px]" /> : <Moon className="w-[15px] h-[15px]" />}
              </Button>

              {/* Language dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className={cn('hidden sm:flex items-center gap-1.5 h-8 px-2 rounded-lg', iconCls)}>
                    <Globe className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{LANG_LABELS[lang]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {(['en','ur'] as Language[]).map(l => (
                    <DropdownMenuItem key={l} onClick={() => setLang(l)}
                      className="flex items-center gap-2 text-sm cursor-pointer">
                      <span>{LANG_FLAGS[l]}</span>
                      <span className="flex-1">{LANG_FULL_LABELS[l]}</span>
                      {lang === l && <Check className="w-3.5 h-3.5 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notifications */}
              {user && (
                <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"
                      className={cn('w-8 h-8 rounded-lg relative transition-all duration-200', iconCls)}>
                      <Bell className="w-[15px] h-[15px]" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-semibold px-0.5">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-popover sticky top-0 z-10">
                      <p className="text-sm font-semibold">
                        Notifications
                        {unreadCount > 0 && (
                          <Badge variant="secondary" className="ml-2 text-xs">{unreadCount} new</Badge>
                        )}
                      </p>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead}
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                          <Check className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No notifications yet</p>
                        </div>
                      ) : notifications.slice(0, 8).map(n => (
                        <button key={n.id}
                          onClick={() => { markRead(n.id); if (n.link) navigate(n.link); setNotifOpen(false); }}
                          className={cn(
                            'w-full text-left px-4 py-3 border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors',
                            !n.is_read && 'bg-[hsl(var(--gold)/0.05)]'
                          )}>
                          <div className="flex gap-2.5 items-start">
                            {!n.is_read && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--gold))] shrink-0 mt-2" />
                            )}
                            <div className={cn('flex-1 min-w-0', n.is_read && 'ml-4')}>
                              <p className="text-sm font-medium truncate">{n.title}</p>
                              {n.message && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.message}</p>
                              )}
                              <p className="text-[11px] text-muted-foreground mt-1">{formatDate(n.created_at)}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="p-2 border-t border-border">
                      <Button variant="ghost" size="sm" className="w-full text-xs h-8"
                        onClick={() => { navigate('/dashboard'); setNotifOpen(false); }}>
                        View all notifications
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* User menu / Auth */}
              {user && profile ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className={cn(
                      'flex items-center gap-1.5 px-1.5 h-8 rounded-lg transition-all duration-200',
                      isSolid ? 'hover:bg-secondary/80' : 'hover:bg-white/10'
                    )}>
                      <Avatar className="w-7 h-7 ring-1 ring-[hsl(var(--gold)/0.4)]">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold">
                          {(profile.full_name || profile.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className={cn('w-3 h-3 hidden md:block', isSolid ? 'text-muted-foreground' : 'text-white/70')} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52" sideOffset={8}>
                    <div className="px-3 py-2.5 border-b border-border">
                      <p className="text-sm font-semibold truncate">{profile.full_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                    </div>
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <User className="w-4 h-4 mr-2" /> {t('dashboard')}
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Shield className="w-4 h-4 mr-2" /> Admin Panel
                      </DropdownMenuItem>
                    )}
                    {isDealershipStaff && (
                      <DropdownMenuItem onClick={() => navigate('/dealership')}>
                        <LayoutDashboard className="w-4 h-4 mr-2" /> Dealership Portal
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" /> {t('logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden md:flex items-center gap-1.5 ml-1">
                  <Button variant="ghost" size="sm" onClick={() => navigate('/login')}
                    className={cn('h-8 px-4 text-[13px] font-medium rounded-lg transition-all duration-200', iconCls)}>
                    {t('login')}
                  </Button>
                  <Button size="sm" onClick={() => navigate('/register')}
                    className={cn(
                      'h-8 px-4 text-[13px] font-semibold rounded-lg transition-all duration-200',
                      !isSolid && 'bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.85)] text-black shadow-[0_0_14px_rgba(196,147,24,0.35)]'
                    )}>
                    {t('register')}
                  </Button>
                </div>
              )}

              {/* Mobile hamburger */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon"
                    className={cn('lg:hidden w-8 h-8 ml-0.5 rounded-lg', isSolid ? 'text-foreground' : 'text-white')}>
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 bg-background flex flex-col p-0">
                  <div className="p-5 border-b border-border flex items-center gap-3">
                    {logoUrl ? (
                      <img src={logoUrl} alt={siteName} className="h-7 w-auto object-contain max-w-[100px] shrink-0" />
                    ) : (
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                        <Car className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                    )}
                    <div className="flex flex-col leading-none">
                      <span className="font-bold text-sm">{siteName}</span>
                      <span className="text-[9px] font-semibold tracking-[0.15em] uppercase text-[hsl(var(--gold))] mt-0.5">Premium Autos</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-0.5">
                    {visibleNavLinks.map(link => (
                      <Link key={link.key} to={link.href} onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-12',
                          isActive(link.href)
                            ? 'bg-secondary text-foreground'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        )}>
                        {t(link.key)}
                      </Link>
                    ))}
                    <Link
                      to={compareList.length >= 2 ? `/compare?ids=${compareList.map(c => c.id).join(',')}` : '/compare'}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-12',
                        isActive('/compare')
                          ? 'bg-secondary text-foreground'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}>
                      <span className="flex items-center gap-2"><Scale className="w-4 h-4" /> Compare</span>
                      {compareList.length > 0 && (
                        <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-semibold">
                          {compareList.length}
                        </span>
                      )}
                    </Link>
                  </div>
                  <div className="p-4 border-t border-border space-y-0.5">
                    <button onClick={toggleDark}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors min-h-12">
                      {dark ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
                      {dark ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <div className="px-3 pt-1 pb-2">
                      <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />{t('language')}</p>
                      <div className="grid grid-cols-2 gap-1">
                        {(['en','ur'] as Language[]).map(l => (
                          <button key={l} onClick={() => setLang(l)}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-colors ${lang === l ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                            <span>{LANG_FLAGS[l]}</span>{LANG_FULL_LABELS[l]}
                          </button>
                        ))}
                      </div>
                    </div>
                    {!user && (
                      <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-border">
                        <Button variant="outline" onClick={() => { navigate('/login'); setMobileOpen(false); }}>
                          {t('login')}
                        </Button>
                        <Button onClick={() => { navigate('/register'); setMobileOpen(false); }}>
                          {t('register')}
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Command Palette */}
      {cmdOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setCmdOpen(false)}
          />
          <div className="fixed top-[15vh] md:top-[20vh] left-1/2 -translate-x-1/2 z-[51] w-[calc(100%-2rem)] max-w-lg animate-scale-in">
            <div className="bg-card border border-border rounded-xl overflow-hidden"
              style={{ boxShadow: 'var(--shadow-premium)' }}>
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input
                  ref={cmdInputRef}
                  value={cmdQuery}
                  onChange={e => setCmdQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && filteredCmd.length > 0) handleCmdSelect(filteredCmd[0].href);
                    if (e.key === 'Escape') setCmdOpen(false);
                  }}
                  placeholder="Search pages, cars, auctions..."
                  className="border-0 shadow-none focus-visible:ring-0 text-sm px-0 h-auto py-0 bg-transparent"
                />
                <kbd className="shrink-0 text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono">
                  ESC
                </kbd>
              </div>
              {/* Results */}
              <div className="py-1.5 max-h-72 overflow-y-auto">
                {/* Car search results */}
                {carResults.length > 0 && (
                  <div>
                    <p className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Listings</p>
                    {carResults.map(car => (
                      <button key={car.id}
                        onClick={() => { navigate(`/cars/${car.id}`); setCmdOpen(false); setCmdQuery(''); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-muted transition-colors text-left">
                        <div className="w-7 h-7 rounded bg-secondary flex items-center justify-center shrink-0">
                          <Car className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{car.title}</p>
                          <p className="text-xs text-muted-foreground">{car.year} · PKR {car.price.toLocaleString()}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                    <div className="px-4 pt-1 pb-2">
                      <button onClick={() => { navigate(`/inventory?search=${encodeURIComponent(cmdQuery)}`); setCmdOpen(false); setCmdQuery(''); }}
                        className="text-xs text-[hsl(var(--gold))] hover:underline flex items-center gap-1">
                        View all results for "{cmdQuery}" <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
                {/* Page links */}
                {(() => {
                  const pageItems = cmdQuery.length < 2
                    ? cmdItems
                    : cmdItems.filter(i => t(i.key).toLowerCase().includes(cmdQuery.toLowerCase()));
                  if (pageItems.length === 0) return null;
                  return (
                    <div className={carResults.length > 0 ? 'border-t border-border mt-1 pt-1' : ''}>
                      <p className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Pages</p>
                      {pageItems.map(item => (
                        <button key={item.href} onClick={() => handleCmdSelect(item.href)}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left">
                          <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                          {t(item.key)}
                        </button>
                      ))}
                    </div>
                  );
                })()}
                {searching && (
                  <p className="text-xs text-muted-foreground text-center py-3">Searching…</p>
                )}
                {!searching && cmdQuery.length >= 2 && carResults.length === 0 && filteredCmd.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No results found</p>
                )}
              </div>
              <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center gap-4">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Command className="w-3 h-3" /> K to open
                </span>
                <span className="text-[11px] text-muted-foreground">↑↓ navigate</span>
                <span className="text-[11px] text-muted-foreground">↵ select</span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
