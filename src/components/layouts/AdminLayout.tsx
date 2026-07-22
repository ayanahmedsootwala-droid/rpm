import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Car, ClipboardList, Users, Building2, Gavel, BarChart3,
  Activity, FileText, Settings, ChevronLeft, ChevronRight, LogOut, Menu, X,
  Globe, Image, Megaphone, Star, Palette, Search, Github, Minimize2, Home, BookOpen, FileCode2, Bot, Shield,
  Database, ExternalLink, ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { cn } from '@/lib/utils';

function getNavGroups(t: (key: string) => string, getSetting: (key: string) => string | undefined) {
  const auctionsOn = getSetting('auctions_feature_enabled') !== 'false';
  const walletOn = getSetting('wallet_feature_enabled') !== 'false';

  return [
  {
    label: t('dashboard'),
    items: [
      { label: t('dashboard'), href: '/admin', icon: LayoutDashboard },
    ]
  },
  {
    label: t('inventory'),
    items: [
      { label: t('inventory'), href: '/admin/inventory', icon: Car },
      { label: t('listingModeration'), href: '/admin/moderation', icon: ClipboardList },
      { label: t('vehicleDatabase'), href: '/admin/vehicle-database', icon: Database },
    ]
  },
  {
    label: t('userManagement'),
    items: [
      { label: t('userManagement'), href: '/admin/users', icon: Users },
      { label: t('dealershipManagement'), href: '/admin/dealerships', icon: Building2 },
      ...(walletOn ? [{ label: 'Wallet Deposits', href: '/admin/wallet-deposits', icon: ShoppingBag }] : []),
    ]
  },
  ...(auctionsOn ? [{
    label: t('auctionManagement'),
    items: [
      { label: t('auctionManagement'), href: '/admin/auctions', icon: Gavel },
      { label: t('analytics'), href: '/admin/auction-analytics', icon: BarChart3 },
    ]
  }] : []),
  {
    label: t('reports'),
    items: [
      { label: t('performance'), href: '/admin/performance', icon: Activity },
      { label: t('reports'), href: '/admin/reports', icon: FileText },
    ]
  },
  {
    label: t('contentManagement'),
    items: [
      { label: t('inquiryManagement'), href: '/admin/inquiries', icon: Megaphone },
      { label: t('blogManagement'), href: '/admin/blog', icon: BookOpen },
      { label: t('testimonialsMgmt'), href: '/admin/testimonials', icon: Star },
    ]
  },
  {
    label: t('themeCustomizer'),
    items: [
      { label: t('homepageSections'), href: '/admin/homepage-sections', icon: Home },
      { label: t('brandCarousel'), href: '/admin/brand-carousel', icon: Globe },
      { label: t('heroBanner'), href: '/admin/hero-banner', icon: Image },
      { label: t('themeCustomizer'), href: '/admin/theme', icon: Palette },
      { label: t('brandSettings'), href: '/admin/brand-settings', icon: Settings },
      { label: t('seoSettings'), href: '/admin/seo-settings', icon: Search },
    ]
  },
  {
    label: t('settings'),
    items: [
      { label: t('imageCompression'), href: '/admin/image-compression', icon: Minimize2 },
      { label: 'Plate Blur (AI)', href: '/admin/plate-blur', icon: Shield },
      { label: 'AI Features', href: '/admin/settings?tab=ai', icon: Bot },
      { label: 'GitHub', href: '/admin/github', icon: Github },
      { label: 'Source Code', href: '/admin/source-code', icon: FileCode2 },
      { label: t('settings'), href: '/admin/settings', icon: Settings },
    ]
  },
]; }

function NavItem({ item, collapsed, active }: { item: { label: string; href: string; icon: React.ElementType }; collapsed: boolean; active: boolean }) {
  const Icon = item.icon;
  const content = (
    <Link
      to={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon className={cn('shrink-0', active ? 'text-sidebar-primary' : '', 'w-4 h-4')} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  return content;
}

function SidebarContent({ collapsed, onClose }: { collapsed: boolean; onClose?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const { getSetting } = useSiteSettings();
  const siteName = getSetting('site_name', 'XYZ Automobiles');
  const navGroups = getNavGroups(t, getSetting);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo */}
      <div className={cn('flex items-center gap-2.5 px-4 py-5 border-b border-sidebar-border', collapsed && 'justify-center px-2')}>
        <div className="w-7 h-7 bg-sidebar-primary rounded-sm flex items-center justify-center shrink-0">
          <Car className="w-4 h-4 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && <span className="font-bold text-sm text-sidebar-foreground truncate">{siteName}</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navGroups.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest px-3 mb-1">{group.label}</p>
            )}
            {group.items.map(item => (
              <NavItem
                key={item.href}
                item={item}
                collapsed={collapsed}
                active={location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href))}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="border-t border-sidebar-border p-2">
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors',
            collapsed && 'justify-center px-2'
          )}
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          {!collapsed && <span>{t('backToSite')}</span>}
        </Link>
        <button
          onClick={handleSignOut}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>{t('logout')}</span>}
        </button>
      </div>
    </div>
  );
}

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('admin_sidebar_collapsed', String(next));
  };


  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col shrink-0 border-r border-sidebar-border transition-all duration-300 relative',
        collapsed ? 'w-14' : 'w-56'
      )}>
        <SidebarContent collapsed={collapsed} />
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar-border border border-sidebar-border flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-background sticky top-0 z-40">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-56 bg-sidebar">
              <SidebarContent collapsed={false} onClose={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="font-semibold text-sm">{t('admin')}</span>
          <div className="w-9" />
        </div>

        <main className="flex-1 min-w-0 overflow-x-hidden p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
