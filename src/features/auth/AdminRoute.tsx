import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { Spinner } from '../../components/ui/Spinner';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (!loading && user && !isAdmin && !notifiedRef.current) {
      notifiedRef.current = true;
      toast.error(t('auth.adminAccessDenied'));
    }
  }, [loading, user, isAdmin, t]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label={t('common.loading')} />
      </div>
    );
  }

  if (!user) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirectTo=${redirectTo}`} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/account" replace />;
  }

  return <>{children}</>;
}
