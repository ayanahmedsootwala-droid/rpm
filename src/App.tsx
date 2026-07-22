import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CompareProvider } from '@/contexts/CompareContext';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { ChunkErrorBoundary } from '@/components/common/ChunkErrorBoundary';
import { useSiteSettings } from '@/hooks/useSiteSettings';

// ── Auth spinner ──────────────────────────────────────────────────────────────
function AuthSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

// ── Guard: admin-only routes ──────────────────────────────────────────────────
// Waits for auth to finish loading, then enforces login + admin role.
// This prevents write requests firing before getSession() resolves (401 fix).
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <AuthSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// ── Guard: dealership-staff routes ────────────────────────────────────────────
function RequireDealership({ children }: { children: React.ReactNode }) {
  const { user, isDealershipStaff, isAdmin, loading } = useAuth();
  if (loading) return <AuthSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isDealershipStaff && !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// ── Guard: auctions feature toggle ───────────────────────────────────────────
function AuctionFeatureGuard({ children }: { children: React.ReactNode }) {
  const { getSetting } = useSiteSettings();
  const navigate = useNavigate();
  const auctionsOn = getSetting('auctions_feature_enabled', 'true') !== 'false';
  React.useEffect(() => {
    if (!auctionsOn) navigate('/', { replace: true });
  }, [auctionsOn, navigate]);
  if (!auctionsOn) return null;
  return <>{children}</>;
}

// Public pages
const HomePage = lazy(() => import('@/pages/HomePage'));
const AboutUsPage = lazy(() => import('@/pages/AboutUsPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const FindMyCarPage = lazy(() => import('@/pages/FindMyCarPage'));
const InventoryPage = lazy(() => import('@/pages/InventoryPage'));
const CarDetailPage = lazy(() => import('@/pages/CarDetailPage'));
const ComparePage = lazy(() => import('@/pages/ComparePage'));
const AuctionsListPage = lazy(() => import('@/pages/AuctionsListPage'));
const AuctionDetailPage = lazy(() => import('@/pages/AuctionDetailPage'));
const BlogPage = lazy(() => import('@/pages/BlogPage'));
const SellCarPage = lazy(() => import('@/pages/SellCarPage'));
const UserDashboardPage = lazy(() => import('@/pages/UserDashboardPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const DealerPublicPage = lazy(() => import('@/pages/DealerPublicPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));

// Dealership pages
const DealershipDashboard = lazy(() => import('@/pages/dealership/DealershipDashboard'));
const DealershipInventory = lazy(() => import('@/pages/dealership/DealershipInventory'));
const DealershipLeads = lazy(() => import('@/pages/dealership/DealershipLeads'));
const DealershipSales = lazy(() => import('@/pages/dealership/DealershipSales'));
const DealershipAnalytics = lazy(() => import('@/pages/dealership/DealershipAnalytics'));
const DealershipCommunication = lazy(() => import('@/pages/dealership/DealershipCommunication'));
const DealershipTeam = lazy(() => import('@/pages/dealership/DealershipTeam'));
const DealershipActivity = lazy(() => import('@/pages/dealership/DealershipActivity'));

// Admin pages
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminInventory = lazy(() => import('@/pages/admin/AdminInventory'));
const AdminModeration = lazy(() => import('@/pages/admin/AdminModeration'));
const AdminVehicleDatabase = lazy(() => import('@/pages/admin/AdminVehicleDatabase'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminDealerships = lazy(() => import('@/pages/admin/AdminDealerships'));
const AdminWalletDeposits = lazy(() => import('@/pages/admin/AdminWalletDeposits'));
const AdminAuctions = lazy(() => import('@/pages/admin/AdminAuctions'));
const AdminAuctionAnalytics = lazy(() => import('@/pages/admin/AdminAuctionAnalytics'));
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'));
const AdminInquiries = lazy(() => import('@/pages/admin/AdminInquiries'));
const AdminBlog = lazy(() => import('@/pages/admin/AdminBlog'));
const AdminTestimonials = lazy(() => import('@/pages/admin/AdminTestimonials'));
const AdminBrands = lazy(() => import('@/pages/admin/AdminBrands'));
const AdminHomepageSections = lazy(() => import('@/pages/admin/AdminHomepageSections'));
const AdminBrandCarousel = lazy(() => import('@/pages/admin/AdminBrandCarousel'));
const AdminHeroBanner = lazy(() => import('@/pages/admin/AdminHeroBanner'));
const AdminTheme = lazy(() => import('@/pages/admin/AdminTheme'));
const AdminBrandSettings = lazy(() => import('@/pages/admin/AdminBrandSettings'));
const AdminSeoSettings = lazy(() => import('@/pages/admin/AdminSeoSettings'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminPerformance = lazy(() => import('@/pages/admin/AdminPerformance'));
const AdminReports = lazy(() => import('@/pages/admin/AdminReports'));
const AdminImageCompression = lazy(() => import('@/pages/admin/AdminImageCompression'));
const AdminNumberPlateBlur = lazy(() => import('@/pages/admin/AdminNumberPlateBlur'));
const AdminGithub = lazy(() => import('@/pages/admin/AdminGithub'));
const AdminSourceCode = lazy(() => import('@/pages/admin/AdminSourceCode'));

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const App: React.FC = () => {
  return (
    <HelmetProvider>
    <Router>
      <SiteSettingsProvider>
      <AuthProvider>
        <LanguageProvider>
          <CompareProvider>
            <ScrollToTop />
            <ChunkErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutUsPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/find-my-car" element={<FindMyCarPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/car/:id" element={<CarDetailPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/auctions" element={<AuctionFeatureGuard><AuctionsListPage /></AuctionFeatureGuard>} />
                <Route path="/auction/:id" element={<AuctionDetailPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPage />} />
                <Route path="/sell" element={<SellCarPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/dashboard" element={<UserDashboardPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Dealership portal */}
                <Route path="/dealership" element={<RequireDealership><DealershipDashboard /></RequireDealership>} />
                <Route path="/dealership/inventory" element={<RequireDealership><DealershipInventory /></RequireDealership>} />
                <Route path="/dealership/leads" element={<RequireDealership><DealershipLeads /></RequireDealership>} />
                <Route path="/dealership/sales" element={<RequireDealership><DealershipSales /></RequireDealership>} />
                <Route path="/dealership/analytics" element={<RequireDealership><DealershipAnalytics /></RequireDealership>} />
                <Route path="/dealership/communication" element={<RequireDealership><DealershipCommunication /></RequireDealership>} />
                <Route path="/dealership/team" element={<RequireDealership><DealershipTeam /></RequireDealership>} />
                <Route path="/dealership/activity" element={<RequireDealership><DealershipActivity /></RequireDealership>} />

                {/* Admin panel */}
                <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                <Route path="/admin/inventory" element={<RequireAdmin><AdminInventory /></RequireAdmin>} />
                <Route path="/admin/moderation" element={<RequireAdmin><AdminModeration /></RequireAdmin>} />
                <Route path="/admin/vehicle-database" element={<RequireAdmin><AdminVehicleDatabase /></RequireAdmin>} />
                <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
                <Route path="/admin/dealerships" element={<RequireAdmin><AdminDealerships /></RequireAdmin>} />
                <Route path="/admin/wallet-deposits" element={<RequireAdmin><AdminWalletDeposits /></RequireAdmin>} />
                <Route path="/admin/auctions" element={<RequireAdmin><AdminAuctions /></RequireAdmin>} />
                <Route path="/admin/auction-analytics" element={<RequireAdmin><AdminAuctionAnalytics /></RequireAdmin>} />
                <Route path="/admin/analytics" element={<RequireAdmin><AdminAnalytics /></RequireAdmin>} />
                <Route path="/admin/performance" element={<RequireAdmin><AdminPerformance /></RequireAdmin>} />
                <Route path="/admin/reports" element={<RequireAdmin><AdminReports /></RequireAdmin>} />
                <Route path="/admin/inquiries" element={<RequireAdmin><AdminInquiries /></RequireAdmin>} />
                <Route path="/admin/blog" element={<RequireAdmin><AdminBlog /></RequireAdmin>} />
                <Route path="/admin/testimonials" element={<RequireAdmin><AdminTestimonials /></RequireAdmin>} />
                <Route path="/admin/brands" element={<RequireAdmin><AdminBrands /></RequireAdmin>} />
                <Route path="/admin/homepage-sections" element={<RequireAdmin><AdminHomepageSections /></RequireAdmin>} />
                <Route path="/admin/brand-carousel" element={<RequireAdmin><AdminBrandCarousel /></RequireAdmin>} />
                <Route path="/admin/hero-banner" element={<RequireAdmin><AdminHeroBanner /></RequireAdmin>} />
                <Route path="/admin/theme" element={<RequireAdmin><AdminTheme /></RequireAdmin>} />
                <Route path="/admin/brand-settings" element={<RequireAdmin><AdminBrandSettings /></RequireAdmin>} />
                <Route path="/admin/seo-settings" element={<RequireAdmin><AdminSeoSettings /></RequireAdmin>} />
                <Route path="/admin/settings" element={<RequireAdmin><AdminSettings /></RequireAdmin>} />
                <Route path="/admin/image-compression" element={<RequireAdmin><AdminImageCompression /></RequireAdmin>} />
                <Route path="/admin/plate-blur" element={<RequireAdmin><AdminNumberPlateBlur /></RequireAdmin>} />
                <Route path="/admin/github" element={<RequireAdmin><AdminGithub /></RequireAdmin>} />
                <Route path="/admin/source-code" element={<RequireAdmin><AdminSourceCode /></RequireAdmin>} />

                <Route path="/dealer/:id" element={<DealerPublicPage />} />

                {/* 404 */}
                <Route path="/404" element={<NotFoundPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
            </ChunkErrorBoundary>
            <Toaster richColors position="top-right" />
          </CompareProvider>
        </LanguageProvider>
      </AuthProvider>
      </SiteSettingsProvider>
    </Router>
    </HelmetProvider>
  );
};

export default App;
