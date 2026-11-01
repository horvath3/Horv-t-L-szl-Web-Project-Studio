import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { IOSInstallModal } from './components/pwa/IOSInstallModal';

// Public Pages
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ServicesPage } from './pages/ServicesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { DownloadsPage } from './pages/DownloadsPage';
import { ProjectRequestPage } from './pages/ProjectRequestPage';
import { RequestStatusPage } from './pages/RequestStatusPage';
import { PromotionDetailPage } from './pages/PromotionDetailPage';
import { ContactPage } from './pages/ContactPage';
import { LiveWorkPage } from './pages/LiveWorkPage';
import { PrivateLivePage } from './pages/PrivateLivePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Admin Pages
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminLiveStreamPage } from './pages/admin/AdminLiveStreamPage';
import { AdminProjectsPage } from './pages/admin/AdminProjectsPage';
import { AdminRequestsPage } from './pages/admin/AdminRequestsPage';
import { AdminEmailTemplatesPage } from './pages/admin/AdminEmailTemplatesPage';
import { AdminPromotionsPage } from './pages/admin/AdminPromotionsPage';
import { AdminDownloadsPage } from './pages/admin/AdminDownloadsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminCapacityPage } from './pages/admin/AdminCapacityPage';

// Initialize storage on boot
import { initializeStorage } from './services/storage';
import { startRealtimeWebAppSync } from './services/syncService';

// Automatically scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Layout wrapper for public pages
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    initializeStorage();
    startRealtimeWebAppSync();
    try {
      registerSW({ immediate: true });
    } catch {
      // Service worker registration fallback
    }
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <OfflineIndicator />
      <IOSInstallModal />
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <HomePage />
            </PublicLayout>
          }
        />
        <Route
          path="/rolam"
          element={
            <PublicLayout>
              <AboutPage />
            </PublicLayout>
          }
        />
        <Route
          path="/szolgaltatasok"
          element={
            <PublicLayout>
              <ServicesPage />
            </PublicLayout>
          }
        />
        <Route
          path="/projektek"
          element={
            <PublicLayout>
              <ProjectsPage />
            </PublicLayout>
          }
        />
        <Route
          path="/projektek/:slug"
          element={
            <PublicLayout>
              <ProjectDetailPage />
            </PublicLayout>
          }
        />
        <Route
          path="/letoltesek"
          element={
            <PublicLayout>
              <DownloadsPage />
            </PublicLayout>
          }
        />
        <Route
          path="/projekt-igeny"
          element={
            <PublicLayout>
              <ProjectRequestPage />
            </PublicLayout>
          }
        />
        <Route
          path="/ajanlatkeres"
          element={
            <PublicLayout>
              <ProjectRequestPage />
            </PublicLayout>
          }
        />
        <Route
          path="/ajanlat-statusz"
          element={
            <PublicLayout>
              <RequestStatusPage />
            </PublicLayout>
          }
        />
        <Route
          path="/ajanlat/:slug"
          element={
            <PublicLayout>
              <PromotionDetailPage />
            </PublicLayout>
          }
        />
        <Route
          path="/promocio/:slug"
          element={
            <PublicLayout>
              <PromotionDetailPage />
            </PublicLayout>
          }
        />
        <Route
          path="/kapcsolat"
          element={
            <PublicLayout>
              <ContactPage />
            </PublicLayout>
          }
        />
        <Route
          path="/elo-munka"
          element={
            <PublicLayout>
              <LiveWorkPage />
            </PublicLayout>
          }
        />
        <Route
          path="/privat-elo/:key"
          element={<PrivateLivePage />}
        />
        <Route
          path="/privat-elo"
          element={<PrivateLivePage />}
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminLayout>
              <AdminDashboardPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/elo-kozvetites"
          element={
            <AdminLayout>
              <AdminLiveStreamPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/projektkapacitas"
          element={
            <AdminLayout>
              <AdminCapacityPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/projektek"
          element={
            <AdminLayout>
              <AdminProjectsPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/ajanlatkeresek"
          element={
            <AdminLayout>
              <AdminRequestsPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/megkeresesek"
          element={
            <AdminLayout>
              <AdminRequestsPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/email-sablonok"
          element={
            <AdminLayout>
              <AdminEmailTemplatesPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/promociok"
          element={
            <AdminLayout>
              <AdminPromotionsPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/letoltesek"
          element={
            <AdminLayout>
              <AdminDownloadsPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/beallitasok"
          element={
            <AdminLayout>
              <AdminSettingsPage />
            </AdminLayout>
          }
        />

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <PublicLayout>
              <NotFoundPage />
            </PublicLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
