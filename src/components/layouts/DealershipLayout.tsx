import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Car, Users, BarChart3, MessageSquare, ClipboardList,
  Activity, LogOut, Menu, X, DollarSign, Car as CarIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const getNavItems = (isDealershipManager: boolean, t: (k: string) => string) => [
  { label: t('dashboard'), href: '/dealership', icon: LayoutDashboard },
  { label: t('inventoryManagement'), href: '/dealership/inventory', icon: Car },
  { label: t('leadsAndCRM'), href: '/dealership/leads', icon: ClipboardList },
  { label: t('salesTransactions'), href: '/dealership/sales', icon: DollarSign },
  { label: t('analytics'), href: '/dealership/analytics', icon: BarChart3 },
  { label: t('communication'), href: '/dealership/communication', icon: MessageSquare },
  ...(isDealershipManager ? [{ label: t('teamManagement'), href: '/dealership/team', icon: Users }] : []),
  { label: t('activityLog'), href: '/dealership/activity', icon: Activity },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, isDealershipManager, getSetting } = useAuth() as ReturnType<typeof useAuth> & { getSetting?: (k: string, d: string) => string };
  const { t } = useLanguage();
  const navItems = getNavItems(isDealershipManager ?? false, t);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-sidebar-border">
        <div className="w-7 h-7 bg-sidebar-primary rounded-sm flex items-center justify-center shrink-0">
          <CarIcon className="w-4 h-4 text-sidebar-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-sidebar-foreground truncate">{t('dealership')}</p>
          <p className="text-sidebar-foreground/40 text-[10px]">Management System</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.href || (item.href !== '/dealership' && location.pathname.startsWith(item.href));
          return (
            <Link key={item.href} to={item.href} onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}>
              <Icon className={cn('w-4 h-4 shrink-0', active && 'text-sidebar-primary')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <button onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
          <LogOut className="w-4 h-4 shrink-0" />
          {t('logout')}
        </button>
      </div>
    </div>
  );
}

export function DealershipLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-sidebar-border">
        <SidebarContent />
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-background sticky top-0 z-40">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-56 bg-sidebar">
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="font-semibold text-sm">Dealership Portal</span>
          <div className="w-9" />
        </div>
        <main className="flex-1 min-w-0 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
