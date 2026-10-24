import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  BookOpen,
  CreditCard,
  FlaskConical,
  MessageSquare,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  Star,
  Truck,
  Wallet,
  Wrench,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { getLocalized } from '../../i18n/helpers';
import {
  formatSlotRange,
  getBookingStatusBadgeVariant,
  getKarachiNowParts,
} from '../booking/bookingUtils';
import {
  ALL_JOB_STATUSES,
  formatPKR,
  getJobStatusBadgeVariant,
  isMissingDatabaseObjectsError,
} from '../jobs/jobUtils';
import { getOrderStatusBadgeVariant } from '../orders/orderUtils';
import type { BookingRow, JobStatus, OrderRow, ProductRow } from '../../types/database';
import { Badge, Button, Card } from '../../components/ui';
import { Seo } from '../../components/common/Seo';

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const pktNow = useMemo(() => getKarachiNowParts(), []);

  const [counts, setCounts] = useState({
    todaysBookings: 0,
    pendingBookings: 0,
    activeServices: 0,
    unreadMessages: 0,
    totalFaqs: 0,
    activeJobs: 0,
    readyForPickup: 0,
    unpaidBalancePkr: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    pendingOrders: 0,
    deliveredSalesPkr: 0,
    pendingCodPkr: 0,
    pendingPayments: 0,
    storePaidRevenuePkr: 0,
    pendingReviews: 0,
    publishedGuides: 0,
    averageRating: 0,
  });
  const [jobsByStatus, setJobsByStatus] = useState<Record<JobStatus, number>>({
    received: 0,
    inspection: 0,
    awaiting_approval: 0,
    in_progress: 0,
    quality_check: 0,
    ready: 0,
    delivered: 0,
    on_hold: 0,
    cancelled: 0,
  });
  const [phase4Missing, setPhase4Missing] = useState<boolean>(false);
  const [phase5Missing, setPhase5Missing] = useState<boolean>(false);
  const [phase6Missing, setPhase6Missing] = useState<boolean>(false);
  const [lowStockItems, setLowStockItems] = useState<ProductRow[]>([]);
  const [recentBookings, setRecentBookings] = useState<BookingRow[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [sevenDaysChart, setSevenDaysChart] = useState<
    Array<{ label: string; count: number; total: number }>
  >([]);
  const [loading, setLoading] = useState<boolean>(env.isConfigured);

  useEffect(() => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [
          todayBkRes,
          pendingBkRes,
          srvRes,
          msgRes,
          faqRes,
          recentBkRes,
          jobsRes,
          invRes,
          prodRes,
          ordersRes,
          paymentsRes,
        ] = await Promise.all([
          supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('booking_date', pktNow.dateStr)
            .not('status', 'in', '("cancelled","rejected")'),
          supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending'),
          supabase
            .from('services')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true),
          supabase
            .from('contact_messages')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'new'),
          supabase
            .from('faqs')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true),
          supabase
            .from('bookings')
            .select('*')
            .order('booking_date', { ascending: false })
            .order('slot_start', { ascending: true })
            .limit(5),
          supabase.from('job_cards').select('status'),
          supabase
            .from('invoices')
            .select('total, amount_paid, status')
            .in('status', ['issued', 'partially_paid']),
          supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('stock_qty', { ascending: true }),
          supabase
            .from('orders')
            .select('*')
            .order('placed_at', { ascending: false })
            .limit(60),
          supabase
            .from('payments')
            .select('amount, status'),
        ]);

        if (!cancelled) {
          let activeJobs = 0;
          let readyForPickup = 0;
          let unpaidBalancePkr = 0;
          let activeProducts = 0;
          let lowStockProducts = 0;
          const statusMap: Record<JobStatus, number> = {
            received: 0,
            inspection: 0,
            awaiting_approval: 0,
            in_progress: 0,
            quality_check: 0,
            ready: 0,
            delivered: 0,
            on_hold: 0,
            cancelled: 0,
          };

          if (
            (jobsRes.error && isMissingDatabaseObjectsError(jobsRes.error)) ||
            (invRes.error && isMissingDatabaseObjectsError(invRes.error))
          ) {
            setPhase4Missing(true);
          } else {
            setPhase4Missing(false);
            if (!jobsRes.error && jobsRes.data) {
              for (const row of jobsRes.data as Array<{ status: JobStatus }>) {
                if (row.status in statusMap) {
                  statusMap[row.status] += 1;
                }
                if (
                  row.status !== 'delivered' &&
                  row.status !== 'cancelled'
                ) {
                  activeJobs += 1;
                }
                if (row.status === 'ready') {
                  readyForPickup += 1;
                }
              }
            }

            if (!invRes.error && invRes.data) {
              for (const inv of invRes.data as Array<{
                total: number;
                amount_paid: number;
              }>) {
                unpaidBalancePkr += Math.max(
                  0,
                  Number(inv.total ?? 0) - Number(inv.amount_paid ?? 0)
                );
              }
            }
          }

          if (prodRes.error && isMissingDatabaseObjectsError(prodRes.error)) {
            setPhase5Missing(true);
            setLowStockItems([]);
          } else {
            setPhase5Missing(false);
            const activeProds = (prodRes.data ?? []) as ProductRow[];
            activeProducts = activeProds.length;
            const alertProds = activeProds.filter(
              (p) => Number(p.stock_qty ?? 0) <= Number(p.low_stock_threshold ?? 3)
            );
            lowStockProducts = alertProds.length;
            setLowStockItems(alertProds.slice(0, 6));
          }

          let pendingOrders = 0;
          let deliveredSalesPkr = 0;
          let pendingCodPkr = 0;
          let orderRows: OrderRow[] = [];

          if (ordersRes.error && isMissingDatabaseObjectsError(ordersRes.error)) {
            setPhase6Missing(true);
            setRecentOrders([]);
            setSevenDaysChart([]);
          } else {
            setPhase6Missing(false);
            orderRows = (ordersRes.data ?? []) as OrderRow[];
            setRecentOrders(orderRows.slice(0, 5));

            for (const ord of orderRows) {
              if (['placed', 'confirmed', 'packed'].includes(ord.status)) {
                pendingOrders += 1;
              }
              if (ord.status === 'delivered') {
                deliveredSalesPkr += Number(ord.total ?? 0);
              }
              if (
                ord.payment_method === 'cod' &&
                ord.payment_status === 'cod_pending' &&
                ord.status !== 'cancelled' &&
                ord.status !== 'returned'
              ) {
                pendingCodPkr += Number(ord.total ?? 0);
              }
            }

            // Build 7-day mini bar chart (past 6 days + today)
            const daysMap: Record<string, { label: string; count: number; total: number }> = {};
            const today = new Date();
            for (let i = 6; i >= 0; i--) {
              const d = new Date(today);
              d.setDate(d.getDate() - i);
              const key = d.toISOString().slice(0, 10);
              const dayName = d.toLocaleDateString('en-GB', { weekday: 'short' });
              daysMap[key] = { label: dayName, count: 0, total: 0 };
            }

            for (const ord of orderRows) {
              const placedDate = (ord.placed_at || ord.created_at || '').slice(0, 10);
              if (daysMap[placedDate]) {
                daysMap[placedDate].count += 1;
                daysMap[placedDate].total += Number(ord.total ?? 0);
              }
            }
            setSevenDaysChart(Object.values(daysMap));
          }

          let pendingPayments = 0;
          let storePaidRevenuePkr = 0;

          if (!paymentsRes?.error && paymentsRes?.data) {
            for (const p of paymentsRes.data as Array<{ amount: number; status: string }>) {
              if (p.status === 'submitted') {
                pendingPayments += 1;
              }
              if (['verified', 'succeeded'].includes(p.status)) {
                storePaidRevenuePkr += Number(p.amount ?? 0);
              }
            }
          }

          let pendingReviews = 0;
          let publishedGuides = 0;
          let averageRating = 0;

          try {
            const [revCountRes, blogCountRes, summaryRes] = await Promise.all([
              supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
              supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('is_published', true),
              supabase.rpc('get_review_summary'),
            ]);
            if (revCountRes?.count) pendingReviews = revCountRes.count;
            if (blogCountRes?.count) publishedGuides = blogCountRes.count;
            if (summaryRes?.data) {
              const sum = summaryRes.data as unknown as { average_rating?: number };
              if (sum.average_rating) averageRating = Number(sum.average_rating);
            }
          } catch {
            // graceful degradation
          }

          setJobsByStatus(statusMap);
          setCounts({
            todaysBookings: todayBkRes.count ?? 0,
            pendingBookings: pendingBkRes.count ?? 0,
            activeServices: srvRes.count ?? 0,
            unreadMessages: msgRes.count ?? 0,
            totalFaqs: faqRes.count ?? 0,
            activeJobs,
            readyForPickup,
            unpaidBalancePkr,
            activeProducts,
            lowStockProducts,
            pendingOrders,
            deliveredSalesPkr,
            pendingCodPkr,
            pendingPayments,
            storePaidRevenuePkr,
            pendingReviews,
            publishedGuides,
            averageRating,
          });
          if (!recentBkRes.error && recentBkRes.data) {
            setRecentBookings(recentBkRes.data as BookingRow[]);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pktNow.dateStr]);

  const liveCards = [
    {
      label: t('admin.dashboard.cards.todaysBookings'),
      value: loading ? '…' : String(counts.todaysBookings),
      href: '/admin/bookings',
      icon: CalendarClock,
      highlight: counts.todaysBookings > 0,
    },
    {
      label: t('admin.dashboard.cards.pendingBookings'),
      value: loading ? '…' : String(counts.pendingBookings),
      href: '/admin/bookings',
      icon: Clock,
      highlight: counts.pendingBookings > 0,
    },
    {
      label: t('admin.dashboard.cards.activeJobs'),
      value: loading ? '…' : phase4Missing ? '—' : String(counts.activeJobs),
      href: '/admin/jobs',
      icon: ClipboardList,
      highlight: counts.activeJobs > 0,
    },
    {
      label: t('admin.dashboard.cards.readyForPickup'),
      value: loading
        ? '…'
        : phase4Missing
          ? '—'
          : String(counts.readyForPickup),
      href: '/admin/jobs',
      icon: CheckCircle2,
      highlight: counts.readyForPickup > 0,
    },
    {
      label: t('admin.dashboard.cards.unpaidBalance'),
      value: loading
        ? '…'
        : phase4Missing
          ? '—'
          : formatPKR(counts.unpaidBalancePkr),
      href: '/admin/invoices',
      icon: Receipt,
      highlight: counts.unpaidBalancePkr > 0,
    },
    {
      label: t('admin.dashboard.cards.pendingOrders', 'Orders to Fulfill'),
      value: loading
        ? '…'
        : phase6Missing
          ? '—'
          : String(counts.pendingOrders),
      href: '/admin/orders?status=active',
      icon: ShoppingBag,
      highlight: counts.pendingOrders > 0,
    },
    {
      label: t('admin.dashboard.cards.deliveredSales', 'Delivered Sales (PKR)'),
      value: loading
        ? '…'
        : phase6Missing
          ? '—'
          : formatPKR(counts.deliveredSalesPkr),
      href: '/admin/orders?status=delivered',
      icon: Banknote,
      highlight: counts.deliveredSalesPkr > 0,
    },
    {
      label: t('admin.dashboard.cards.pendingCod', 'COD Pending Collection'),
      value: loading
        ? '…'
        : phase6Missing
          ? '—'
          : formatPKR(counts.pendingCodPkr),
      href: '/admin/orders?payment_status=cod_pending',
      icon: Truck,
      highlight: counts.pendingCodPkr > 0,
    },
    {
      label: t('admin.dashboard.cards.pendingPayments', 'Payments to Verify'),
      value: loading ? '…' : String(counts.pendingPayments),
      href: '/admin/payments',
      icon: Wallet,
      highlight: counts.pendingPayments > 0,
    },
    {
      label: t('admin.dashboard.cards.storePaidRevenue', 'Store Paid Revenue'),
      value: loading ? '…' : formatPKR(counts.storePaidRevenuePkr),
      href: '/admin/payments',
      icon: CreditCard,
      highlight: counts.storePaidRevenuePkr > 0,
    },
    {
      label: t('admin.dashboard.cards.activeProducts'),
      value: loading
        ? '…'
        : phase5Missing
          ? '—'
          : String(counts.activeProducts),
      href: '/admin/products',
      icon: Package,
    },
    {
      label: t('admin.dashboard.cards.lowStockProducts'),
      value: loading
        ? '…'
        : phase5Missing
          ? '—'
          : String(counts.lowStockProducts),
      href: '/admin/products?stock=alert',
      icon: AlertTriangle,
      highlight: counts.lowStockProducts > 0,
    },
    {
      label: t('admin.dashboard.cards.activeServices'),
      value: loading ? '…' : String(counts.activeServices),
      href: '/admin/services',
      icon: Wrench,
    },
    {
      label: t('admin.dashboard.cards.unreadMessages'),
      value: loading ? '…' : String(counts.unreadMessages),
      href: '/admin/messages',
      icon: MessageSquare,
      highlight: counts.unreadMessages > 0,
    },
    {
      label: t('admin.dashboard.cards.pendingReviews', 'Pending Reviews'),
      value: loading ? '…' : String(counts.pendingReviews),
      href: '/admin/reviews',
      icon: Star,
      highlight: counts.pendingReviews > 0,
    },
    {
      label: t('admin.dashboard.cards.publishedGuides', 'Published Guides'),
      value: loading ? '…' : String(counts.publishedGuides),
      href: '/admin/blog',
      icon: BookOpen,
      highlight: counts.publishedGuides > 0,
    },
    {
      label: t('admin.dashboard.cards.averageRating', 'Average Customer Rating'),
      value: loading
        ? '…'
        : counts.averageRating > 0
          ? `${counts.averageRating.toFixed(1)} / 5.0`
          : '—',
      href: '/admin/reviews',
      icon: Star,
      highlight: counts.averageRating >= 4.5,
    },
  ];

  return (
    <div className="space-y-8 text-start">
      <Seo title={t('admin.dashboard.title')} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white heading-accent mb-2">
            {t('admin.dashboard.title')}
          </h1>
          <p className="text-sm text-[#8A93A3]">
            {t('admin.dashboard.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/admin/jobs">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ClipboardList className="w-4 h-4 text-[#FF6A00]" />}
            >
              {t('admin.nav.jobs')}
            </Button>
          </Link>
          <Link to="/admin/bookings">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CalendarClock className="w-4 h-4" />}
            >
              {t('admin.nav.bookings')}
            </Button>
          </Link>
        </div>
      </div>

      {phase4Missing && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#FFC21A] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h2 className="text-xs sm:text-sm font-bold text-white">
              {t('common.databaseSetupNeededTitle')}
            </h2>
            <p className="text-xs text-[#F5F6F8]/85">
              {t('common.databaseSetupNeededDesc')}
            </p>
          </div>
        </Card>
      )}

      {/* Live Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {liveCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} to={card.href} className="block group">
              <Card className="p-5 h-full flex flex-col justify-between border-white/10 group-hover:border-[#FF6A00] transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-md bg-[#2A2F38] flex items-center justify-center text-[#FF6A00]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#8A93A3] group-hover:text-[#FF6A00] rtl-flip transition-colors" />
                </div>

                <div>
                  <div
                    dir="ltr"
                    className={`text-2xl sm:text-3xl font-bold font-heading tabular-nums mb-1 ${
                      card.highlight ? 'text-[#FFC21A]' : 'text-white'
                    }`}
                  >
                    {card.value}
                  </div>
                  <div className="text-xs font-medium text-[#8A93A3]">
                    {card.label}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Jobs by Status Breakdown */}
      {!phase4Missing && (
        <Card className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-bold font-heading text-white">
              {t('admin.dashboard.jobsByStatusTitle')}
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/admin/invoices"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FFC21A] hover:underline"
              >
                <span>{t('admin.dashboard.manageAllInvoices')}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
              </Link>
              <Link
                to="/admin/jobs"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF6A00] hover:underline"
              >
                <span>{t('admin.dashboard.manageAllJobs')}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5">
            {ALL_JOB_STATUSES.map((st) => (
              <Link
                key={st}
                to={`/admin/jobs?status=${st}`}
                className="rounded-md bg-[#0E1013] border border-white/10 hover:border-[#FF6A00] p-3 flex flex-col justify-between gap-2 transition-colors"
              >
                <Badge variant={getJobStatusBadgeVariant(st)}>
                  {t(`jobs.statuses.${st}`)}
                </Badge>
                <span
                  dir="ltr"
                  className="text-xl font-bold font-heading text-white tabular-nums"
                >
                  {jobsByStatus[st] ?? 0}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Low & Out of Stock Catalogue Alert (Phase 5) */}
      {!phase5Missing && lowStockItems.length > 0 && (
        <Card className="p-6 space-y-4 border-amber-500/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-[#FFC21A] shrink-0" />
              <h2 className="text-lg font-bold font-heading text-white">
                {t('admin.dashboard.lowStockAlertTitle')}
              </h2>
            </div>
            <Link
              to="/admin/products?stock=alert"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF6A00] hover:underline"
            >
              <span>{t('admin.dashboard.manageInventory')}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockItems.map((item) => {
              const isOut = item.stock_qty <= 0;
              return (
                <Link
                  key={item.id}
                  to="/admin/products?stock=alert"
                  className="rounded-md bg-[#0E1013] border border-white/10 hover:border-[#FF6A00] p-3.5 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0">
                    <span
                      dir="ltr"
                      className="text-[11px] font-mono font-bold text-[#FFC21A] block"
                    >
                      {item.sku}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-white truncate block">
                      {getLocalized(item, 'name', i18n.language)}
                    </span>
                  </div>
                  <Badge variant={isOut ? 'danger' : 'warning'}>
                    {isOut
                      ? t('shop.stock.outOfStock')
                      : t('shop.stock.lowStockCount', {
                          count: item.stock_qty,
                        })}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {/* Recent & Upcoming Bookings Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold font-heading text-white">
            {t('admin.dashboard.recentBookingsTitle')}
          </h2>
          <Link
            to="/admin/bookings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF6A00] hover:underline"
          >
            <span>{t('admin.dashboard.viewAllBookings')}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <p className="text-xs text-[#8A93A3] py-4">
            {t('admin.bookings.emptyDescription')}
          </p>
        ) : (
          <div className="space-y-2.5">
            {recentBookings.map((bk) => (
              <Link
                key={bk.id}
                to="/admin/bookings"
                className="rounded-md bg-[#0E1013] border border-white/10 hover:border-[#FF6A00] p-3.5 flex flex-wrap items-center justify-between gap-3 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    dir="ltr"
                    className="text-xs sm:text-sm font-bold font-mono text-[#FFC21A]"
                  >
                    {bk.booking_no}
                  </span>
                  <Badge variant={getBookingStatusBadgeVariant(bk.status)}>
                    {t(`booking.statuses.${bk.status}`)}
                  </Badge>
                  {bk.is_demo && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                      <FlaskConical className="w-2.5 h-2.5" />
                      <span>{t('demo.badge')}</span>
                    </span>
                  )}
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    {bk.customer_name}
                  </span>
                  <span className="text-xs text-[#8A93A3]">
                    {[bk.make_text, bk.model_text].filter(Boolean).join(' ')}
                  </span>
                </div>

                <div dir="ltr" className="text-xs text-[#8A93A3] tabular-nums">
                  {bk.booking_date} •{' '}
                  {formatSlotRange(bk.slot_start, bk.slot_end)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Phase 6: E-Commerce Store Orders & Sales Section */}
      {!phase6Missing && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#FF6A00]" />
                <span>{t('admin.dashboard.storeOrdersTitle', 'Store Orders & E-Commerce')}</span>
              </h2>
              <p className="text-xs text-[#8A93A3]">
                {t('admin.dashboard.storeOrdersSubtitle', 'Order volume, cash on delivery collection, and courier fulfillment.')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link to="/admin/delivery">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Truck className="w-4 h-4 text-[#FF6A00]" />}
                >
                  {t('admin.nav.delivery', 'Delivery & Coupons')}
                </Button>
              </Link>
              <Link to="/admin/orders">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<ShoppingBag className="w-4 h-4" />}
                  rightIcon={<ArrowRight className="w-4 h-4 rtl-flip" />}
                >
                  {t('admin.dashboard.viewAllOrders', 'Manage All Orders')}
                </Button>
              </Link>
            </div>
          </div>

          {/* 7-Day Mini Bar Chart */}
          <div className="space-y-3 bg-[#0E1013] border border-white/10 rounded-lg p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">
                {t('admin.dashboard.ordersLast7Days', 'Order Activity (Last 7 Days)')}
              </span>
              <span className="text-[#8A93A3]">
                {counts.pendingOrders} {t('admin.orders.status.placed', 'pending fulfillment')}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 pt-2 items-end h-28">
              {sevenDaysChart.map((day, idx) => {
                const maxCount = Math.max(1, ...sevenDaysChart.map((d) => d.count));
                const barHeight = Math.max(12, Math.round((day.count / maxCount) * 100));
                return (
                  <div key={idx} className="flex flex-col items-center justify-end h-full gap-1.5 group">
                    <span className="text-[10px] text-[#8A93A3] group-hover:text-white tabular-nums">
                      {day.count > 0 ? day.count : ''}
                    </span>
                    <div className="w-full max-w-[32px] bg-white/10 rounded-t overflow-hidden flex flex-col justify-end h-16">
                      <div
                        style={{ height: `${day.count === 0 ? 4 : barHeight}%` }}
                        className={`w-full rounded-t transition-all ${
                          day.count > 0
                            ? 'bg-gradient-to-t from-[#FF6A00] to-[#FFC21A]'
                            : 'bg-white/10'
                        }`}
                        title={`${day.label}: ${day.count} order(s), ${formatPKR(day.total)}`}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-[#8A93A3] uppercase">
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Orders List */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8A93A3]">
              {t('admin.dashboard.recentOrdersTitle', 'Recent Store Orders')}
            </h3>

            {recentOrders.length === 0 ? (
              <p className="text-xs text-[#8A93A3] py-2">
                {t('admin.orders.emptyDescription', 'No store orders placed yet.')}
              </p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((ord) => (
                  <Link
                    key={ord.id}
                    to={`/admin/orders/${ord.id}`}
                    className="rounded-md bg-[#0E1013] border border-white/10 hover:border-[#FF6A00] p-3 flex flex-wrap items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span dir="ltr" className="text-xs font-mono font-bold text-[#FFC21A]">
                        {ord.order_no}
                      </span>
                      <Badge variant={getOrderStatusBadgeVariant(ord.status)}>
                        {t(`order.statuses.${ord.status}`, ord.status)}
                      </Badge>
                      <span className="text-xs sm:text-sm font-semibold text-white">
                        {ord.customer_name}
                      </span>
                      <span className="text-xs text-[#8A93A3]">
                        {ord.city}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-white tabular-nums font-mono">
                        {formatPKR(ord.total)}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#8A93A3] rtl-flip" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Quick Site Settings Card */}
      <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-[#FF6A00]/30">
        <div className="space-y-1">
          <h2 className="text-base font-bold font-heading text-white">
            {t('admin.dashboard.quickSetupTitle')}
          </h2>
          <p className="text-xs text-[#8A93A3] leading-relaxed">
            {t('admin.dashboard.quickSetupDescription')}
          </p>
        </div>
        <Link to="/admin/settings">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Settings className="w-4 h-4 text-[#FF6A00]" />}
            rightIcon={<ArrowRight className="w-4 h-4 rtl-flip" />}
          >
            {t('admin.dashboard.goToSettings')}
          </Button>
        </Link>
      </Card>
    </div>
  );
}

