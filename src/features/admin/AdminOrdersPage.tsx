import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock,
  FlaskConical,
  MapPin,
  Package,
  Printer,
  RefreshCw,
  Search,
  Settings,
  Truck,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatKarachiDateTime, formatPKR } from '../../lib/format';
import { isMissingDatabaseObjectsError } from '../jobs/jobUtils';
import {
  ALL_ORDER_STATUSES,
  getOrderPaymentStatusBadgeVariant,
  getOrderStatusBadgeVariant,
} from '../orders/orderUtils';
import type { OrderItemRow, OrderPaymentStatus, OrderRow, OrderStatus } from '../../types/database';
import { Seo } from '../../components/common/Seo';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';

interface AdminOrderRow extends OrderRow {
  order_items?: OrderItemRow[];
}

export function AdminOrdersPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemaMissing, setSchemaMissing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('placed_at', { ascending: false });

      if (error) {
        if (isMissingDatabaseObjectsError(error)) {
          setSchemaMissing(true);
        }
        return;
      }

      setSchemaMissing(false);
      setOrders((data ?? []) as unknown as AdminOrderRow[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const distinctCities = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.city) set.add(o.city);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [orders]);

  // Sales KPIs
  const metrics = useMemo(() => {
    const activeStatuses: OrderStatus[] = [
      'placed',
      'confirmed',
      'packed',
      'shipped',
    ];
    let activeCount = 0;
    let deliveredRevenue = 0;
    let pendingCodAmount = 0;

    for (const o of orders) {
      if (activeStatuses.includes(o.status)) {
        activeCount += 1;
      }
      if (o.status === 'delivered') {
        deliveredRevenue += Number(o.total ?? 0);
      }
      if (
        o.payment_method === 'cod' &&
        o.payment_status === 'cod_pending' &&
        o.status !== 'cancelled' &&
        o.status !== 'returned'
      ) {
        pendingCodAmount += Number(o.total ?? 0);
      }
    }

    return {
      totalOrders: orders.length,
      activeCount,
      deliveredRevenue,
      pendingCodAmount,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((ord) => {
      if (statusFilter !== 'all' && ord.status !== statusFilter) return false;
      if (paymentFilter !== 'all' && ord.payment_status !== paymentFilter)
        return false;
      if (cityFilter !== 'all' && ord.city !== cityFilter) return false;

      if (q) {
        const matchOrderNo = ord.order_no.toLowerCase().includes(q);
        const matchName = ord.customer_name.toLowerCase().includes(q);
        const matchPhone = ord.customer_phone.toLowerCase().includes(q);
        const matchTracking = (ord.tracking_number || '')
          .toLowerCase()
          .includes(q);
        const matchCity = ord.city.toLowerCase().includes(q);
        if (
          !matchOrderNo &&
          !matchName &&
          !matchPhone &&
          !matchTracking &&
          !matchCity
        ) {
          return false;
        }
      }
      return true;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter, cityFilter]);

  return (
    <div className="space-y-6 text-start">
      <Seo title={`${t('admin.orders.title')} — Admin`} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white heading-accent mb-2">
            {t('admin.orders.title')}
          </h1>
          <p className="text-xs sm:text-sm text-[#8A93A3]">
            {t('admin.orders.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/delivery">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Settings className="w-4 h-4 text-[#FF6A00]" />}
            >
              {t('admin.orders.deliveryAndCouponsBtn')}
            </Button>
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => void fetchOrders()}
          >
            {t('admin.jobs.refreshBtn')}
          </Button>
        </div>
      </div>

      {schemaMissing ? (
        <Card className="p-6 border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#FFC21A] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">
              {t('common.databaseSetupNeededTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-[#F5F6F8]/85">
              {t('common.databaseSetupNeededDesc')}
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#8A93A3] block">
                  {t('admin.orders.metrics.totalOrders')}
                </span>
                <p
                  dir="ltr"
                  className="text-2xl font-extrabold font-mono text-white mt-1"
                >
                  {metrics.totalOrders}
                </p>
              </div>
              <div className="w-10 h-10 rounded-md bg-[#2A2F38] flex items-center justify-center text-[#FF6A00]">
                <Package className="w-5 h-5" />
              </div>
            </Card>

            <Card className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#8A93A3] block">
                  {t('admin.orders.metrics.activeToFulfill')}
                </span>
                <p
                  dir="ltr"
                  className="text-2xl font-extrabold font-mono text-[#FFC21A] mt-1"
                >
                  {metrics.activeCount}
                </p>
              </div>
              <div className="w-10 h-10 rounded-md bg-[#FFC21A]/15 flex items-center justify-center text-[#FFC21A]">
                <Clock className="w-5 h-5" />
              </div>
            </Card>

            <Card className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#8A93A3] block">
                  {t('admin.orders.metrics.deliveredRevenue')}
                </span>
                <p
                  dir="ltr"
                  className="text-xl font-extrabold font-mono text-emerald-400 mt-1"
                >
                  {formatPKR(metrics.deliveredRevenue)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-md bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </Card>

            <Card className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#8A93A3] block">
                  {t('admin.orders.metrics.pendingCod')}
                </span>
                <p
                  dir="ltr"
                  className="text-xl font-extrabold font-mono text-[#FF6A00] mt-1"
                >
                  {formatPKR(metrics.pendingCodAmount)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-md bg-[#FF6A00]/15 flex items-center justify-center text-[#FF6A00]">
                <Banknote className="w-5 h-5" />
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#8A93A3] absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('admin.orders.searchPlaceholder')}
                  className="ps-9"
                />
              </div>

              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: t('admin.orders.allStatuses') },
                  ...ALL_ORDER_STATUSES.map((st) => ({
                    value: st,
                    label: t(`orders.statuses.${st}`),
                  })),
                ]}
              />

              <Select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                options={[
                  { value: 'all', label: t('admin.orders.allPaymentStatuses') },
                  ...(
                    [
                      'cod_pending',
                      'cod_collected',
                      'pending',
                      'paid',
                      'failed',
                      'refunded',
                    ] as OrderPaymentStatus[]
                  ).map((ps) => ({
                    value: ps,
                    label: t(`orders.paymentStatuses.${ps}`),
                  })),
                ]}
              />

              <Select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                options={[
                  { value: 'all', label: t('admin.orders.allCities') },
                  ...distinctCities.map((c) => ({ value: c, label: c })),
                ]}
              />
            </div>

            {/* Quick Status Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {(['all', ...ALL_ORDER_STATUSES] as const).map((st) => {
                const count =
                  st === 'all'
                    ? orders.length
                    : orders.filter((o) => o.status === st).length;
                const active = statusFilter === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#FF6A00] text-white'
                        : 'bg-[#0E1013] text-[#8A93A3] hover:text-white border border-white/10'
                    }`}
                  >
                    <span>
                      {st === 'all'
                        ? t('admin.orders.allStatuses')
                        : t(`orders.statuses.${st}`)}
                    </span>
                    <span
                      dir="ltr"
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        active
                          ? 'bg-black/25 text-white'
                          : 'bg-white/10 text-[#F5F6F8]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Orders List */}
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <EmptyState
              title={t('admin.orders.emptyTitle')}
              description={t('admin.orders.emptyDesc')}
            />
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((ord) => {
                const itemCount = (ord.order_items ?? []).reduce(
                  (acc, i) => acc + i.quantity,
                  0
                );
                return (
                  <Card
                    key={ord.id}
                    className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-white/20 transition-colors"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/admin/orders/${ord.id}`}
                          dir="ltr"
                          className="text-lg font-extrabold font-mono text-[#FFC21A] hover:underline"
                        >
                          {ord.order_no}
                        </Link>
                        <Badge variant={getOrderStatusBadgeVariant(ord.status)}>
                          {t(`orders.statuses.${ord.status}`)}
                        </Badge>
                        <Badge
                          variant={getOrderPaymentStatusBadgeVariant(
                            ord.payment_status
                          )}
                        >
                          {t(`orders.paymentStatuses.${ord.payment_status}`)}
                        </Badge>
                        {ord.is_demo && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[11px] font-semibold text-[#FFC21A]">
                            <FlaskConical className="w-3 h-3" />
                            <span>{t('demo.badge')}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-[#F5F6F8]">
                        <span className="font-semibold text-white">
                          {ord.customer_name}
                        </span>
                        <span dir="ltr" className="font-mono text-[#8A93A3]">
                          {ord.customer_phone}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[#FFC21A]">
                          <MapPin className="w-3.5 h-3.5 text-[#FF6A00]" />
                          <span>{ord.city}</span>
                        </span>
                        <span className="text-[#8A93A3]">
                          {itemCount} {t('catalogue.itemsCount')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#8A93A3]">
                        <span dir="ltr">
                          {formatKarachiDateTime(ord.placed_at)} (PKT)
                        </span>
                        {ord.courier_name && (
                          <span className="inline-flex items-center gap-1 text-emerald-300">
                            <Truck className="w-3.5 h-3.5" />
                            <span>
                              {ord.courier_name}
                              {ord.tracking_number
                                ? `: ${ord.tracking_number}`
                                : ''}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
                      <div className="text-start lg:text-end">
                        <span
                          dir="ltr"
                          className="text-lg font-extrabold font-mono text-white block"
                        >
                          {formatPKR(ord.total)}
                        </span>
                        <span className="text-[11px] text-[#8A93A3]">
                          {Number(ord.delivery_charge) === 0
                            ? t('cart.delivery.freeBadge')
                            : `+ ${formatPKR(ord.delivery_charge)} ${t('cart.summary.delivery')}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link to={`/order/${ord.id}/print`}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            leftIcon={<Printer className="w-3.5 h-3.5" />}
                          >
                            {t('admin.orders.printBtn')}
                          </Button>
                        </Link>
                        <Link to={`/admin/orders/${ord.id}`}>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            rightIcon={
                              <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
                            }
                          >
                            {t('admin.orders.manageBtn')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
