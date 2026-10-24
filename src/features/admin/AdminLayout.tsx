import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ExternalLink, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { AdminSidebar } from './AdminSidebar';
import { LanguageSwitcher } from '../../components/layout/LanguageSwitcher';
import { DemoModeBanner } from '../../components/common/DemoModeBanner';
import { Button } from '../../components/ui/Button';

export default function AdminLayout() {
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const adminName = profile?.full_name?.trim() || user?.email || 'Admin';

  const handleSignOut = async () => {
    await signOut();
    toast.success(t('auth.logoutSuccess'));
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-[#0E1013] text-[#F5F6F8]">
      <AdminSidebar
        isOpenMobile={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DemoModeBanner />
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-[#1B1F26]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={t('admin.openSidebar')}
              className="lg:hidden p-2 rounded-md bg-[#2A2F38] text-[#F5F6F8] hover:text-[#FF6A00]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-[#F5F6F8] truncate">
              {adminName}
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            <Link to="/">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ExternalLink className="w-3.5 h-3.5 text-[#FF6A00]" />}
              >
                {t('admin.viewSite')}
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
            >
              <span className="hidden sm:inline">{t('admin.signOut')}</span>
            </Button>
          </div>
        </header>

        {/* Mobile Language Switcher Bar */}
        <div className="sm:hidden bg-[#1B1F26] border-b border-white/10 px-4 py-2 flex justify-end">
          <LanguageSwitcher />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
