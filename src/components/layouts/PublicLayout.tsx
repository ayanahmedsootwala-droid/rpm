import { type ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { CompareBar } from '@/components/cars/CompareBar';
import { MobileBottomNav } from './MobileBottomNav';

interface PublicLayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
  hideFooter?: boolean;
}

export function PublicLayout({ children, hideHeader, hideFooter }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col pb-16 md:pb-0">
      {!hideHeader && <Header />}
      <main className="flex-1 min-w-0">
        {children}
      </main>
      {!hideFooter && <Footer />}
      <CompareBar />
      <MobileBottomNav />
    </div>
  );
}
