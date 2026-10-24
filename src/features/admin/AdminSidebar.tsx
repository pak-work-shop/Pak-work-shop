import React, { useCallback, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Award,
  BookOpen,
  Bot,
  Calculator,
  CalendarClock,
  ClipboardList,
  CreditCard,
  FileText,
  FolderTree,
  HelpCircle,
  Image as ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  Sliders,
  Star,
  Truck,
  Wrench,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { Logo } from '../../components/common/Logo';
import { cn } from '../../lib/utils';

export interface AdminSidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function notifyAdminMessagesUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('admin-messages-updated'));
  }
}

export function notifyAdminBookingsUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('admin-bookings-updated'));
  }
}

export function notifyAdminJobsUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('admin-jobs-updated'));
  }
}

export function notifyAdminProductsUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('admin-products-updated'));
  }
}

export function notifyAdminOrdersUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('admin-orders-updated'));
  }
}

export function notifyAdminPaymentsUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('admin-payments-updated'));
  }
}

export function notifyAdminReviewsUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('admin-reviews-updated'));
  }
}

export function AdminSidebar({ isOpenMobile, onCloseMobile }: AdminSidebarProps) {
  const { t } = useTranslation();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [pendingBookingsCount, setPendingBookingsCount] = useState<number>(0);
  const [activeJobsCount, setActiveJobsCount] = useState<number>(0);
  const [lowStockProductsCount, setLowStockProductsCount] = useState<number>(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState<number>(0);
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(0);

  const fetchCounts = useCallback(async () => {
    if (!env.isConfigured) return;
    try {
      const [msgRes, bkRes, jobRes, prodRes, ordRes, payRes, revRes] = await Promise.all([
        supabase
          .from('contact_messages')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'new'),
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('job_cards')
          .select('*', { count: 'exact', head: true })
          .not('status', 'in', '("delivered","cancelled")'),
        supabase
          .from('products')
          .select('stock_qty, low_stock_threshold')
          .eq('is_active', true),
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .in('status', ['placed', 'confirmed', 'packed']),
        supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'submitted'),
        supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ]);

      if (!msgRes.error && typeof msgRes.count === 'number') {
        setUnreadMessagesCount(msgRes.count);
      }
      if (!bkRes.error && typeof bkRes.count === 'number') {
        setPendingBookingsCount(bkRes.count);
      }
      if (!jobRes.error && typeof jobRes.count === 'number') {
        setActiveJobsCount(jobRes.count);
      }
      if (!ordRes.error && typeof ordRes.count === 'number') {
        setPendingOrdersCount(ordRes.count);
      }
      if (!payRes.error && typeof payRes.count === 'number') {
        setPendingPaymentsCount(payRes.count);
      }
      if (!revRes.error && typeof revRes.count === 'number') {
        setPendingReviewsCount(revRes.count);
      }
      if (!prodRes.error && prodRes.data) {
        const lowCount = (
          prodRes.data as Array<{
            stock_qty: number;
            low_stock_threshold: number;
          }>
        ).filter(
          (row) =>
            Number(row.stock_qty ?? 0) <= Number(row.low_stock_threshold ?? 3)
        ).length;
        setLowStockProductsCount(lowCount);
      }
    } catch {
      // Ignore badge count errors gracefully
    }
  }, []);

  useEffect(() => {
    void fetchCounts();

    const onUpdate = () => {
      void fetchCounts();
    };
    window.addEventListener('admin-messages-updated', onUpdate);
    window.addEventListener('admin-bookings-updated', onUpdate);
    window.addEventListener('admin-jobs-updated', onUpdate);
    window.addEventListener('admin-products-updated', onUpdate);
    window.addEventListener('admin-orders-updated', onUpdate);
    window.addEventListener('admin-payments-updated', onUpdate);
    window.addEventListener('admin-reviews-updated', onUpdate);
    return () => {
      window.removeEventListener('admin-messages-updated', onUpdate);
      window.removeEventListener('admin-bookings-updated', onUpdate);
      window.removeEventListener('admin-jobs-updated', onUpdate);
      window.removeEventListener('admin-products-updated', onUpdate);
      window.removeEventListener('admin-orders-updated', onUpdate);
      window.removeEventListener('admin-payments-updated', onUpdate);
      window.removeEventListener('admin-reviews-updated', onUpdate);
    };
  }, [fetchCounts]);

  const navItems = [
    {
      label: t('admin.nav.dashboard'),
      href: '/admin',
      icon: LayoutDashboard,
      end: true,
    },
    {
      label: t('admin.nav.bookings'),
      href: '/admin/bookings',
      icon: CalendarClock,
      end: false,
      badge: pendingBookingsCount > 0 ? pendingBookingsCount : undefined,
    },
    {
      label: t('admin.nav.jobs'),
      href: '/admin/jobs',
      icon: ClipboardList,
      end: false,
      badge: activeJobsCount > 0 ? activeJobsCount : undefined,
    },
    {
      label: t('admin.nav.invoices'),
      href: '/admin/invoices',
      icon: Receipt,
      end: false,
    },
    {
      label: t('admin.nav.orders', 'Orders'),
      href: '/admin/orders',
      icon: ShoppingBag,
      end: false,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    },
    {
      label: t('admin.nav.payments', 'Payments'),
      href: '/admin/payments',
      icon: CreditCard,
      end: false,
      badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined,
    },
    {
      label: t('admin.nav.paymentSettings', 'Payment Settings'),
      href: '/admin/payment-settings',
      icon: Sliders,
      end: false,
    },
    {
      label: t('admin.nav.delivery', 'Delivery & Coupons'),
      href: '/admin/delivery',
      icon: Truck,
      end: false,
    },
    {
      label: t('admin.nav.products'),
      href: '/admin/products',
      icon: Package,
      end: false,
      badge: lowStockProductsCount > 0 ? lowStockProductsCount : undefined,
    },
    {
      label: t('admin.nav.categories'),
      href: '/admin/categories',
      icon: FolderTree,
      end: false,
    },
    {
      label: t('admin.nav.brands'),
      href: '/admin/brands',
      icon: Award,
      end: false,
    },
    {
      label: t('admin.nav.services'),
      href: '/admin/services',
      icon: Wrench,
      end: false,
    },
    {
      label: t('admin.nav.blog', 'Blog & Guides'),
      href: '/admin/blog',
      icon: BookOpen,
      end: false,
    },
    {
      label: t('admin.nav.reviews', 'Reviews'),
      href: '/admin/reviews',
      icon: Star,
      end: false,
      badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined,
    },
    {
      label: t('admin.nav.gallery', 'Gallery'),
      href: '/admin/gallery',
      icon: ImageIcon,
      end: false,
    },
    {
      label: t('admin.nav.estimator', 'Estimator Rules'),
      href: '/admin/estimator',
      icon: Calculator,
      end: false,
    },
    {
      label: t('admin.nav.chatbot', 'AI Chatbot'),
      href: '/admin/chatbot',
      icon: Bot,
      end: false,
    },
    {
      label: t('admin.nav.faqs'),
      href: '/admin/faqs',
      icon: HelpCircle,
      end: false,
    },
    {
      label: t('admin.nav.messages'),
      href: '/admin/messages',
      icon: MessageSquare,
      end: false,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
    {
      label: t('admin.nav.pages'),
      href: '/admin/pages',
      icon: FileText,
      end: false,
    },
    {
      label: t('admin.nav.siteSettings'),
      href: '/admin/settings',
      icon: Settings,
      end: false,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#1B1F26] border-e border-white/10 w-64 text-[#F5F6F8]">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <Logo compact />
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label={t('nav.closeMenu')}
          className="lg:hidden p-1.5 rounded-md text-[#8A93A3] hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 pt-4 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A93A3]">
          {t('admin.panelHeading')}
        </span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#FF6A00] text-white font-semibold'
                    : 'text-[#8A93A3] hover:bg-white/5 hover:text-white'
                )
              }
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>

              {item.badge !== undefined && (
                <span className="inline-flex items-center justify-center rounded-full bg-[#EF4444] text-white text-[11px] font-bold px-2 py-0.5 leading-none">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0">{sidebarContent}</aside>

      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
