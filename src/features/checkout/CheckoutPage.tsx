import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Copy,
  CreditCard,
  MapPin,
  MessageCircle,
  Printer,
  Search,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Truck,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { useAuth } from '../auth/useAuth';
import { useSiteSettings } from '../settings/useSiteSettings';
import { useCart } from '../cart/CartContext';
import { isMissingDatabaseObjectsError } from '../jobs/jobUtils';
import { getLocalized } from '../../i18n/helpers';
import {
  createCheckoutFormSchema,
  type CheckoutFormValues,
} from '../../lib/validators';
import { formatPKRPrice } from '../catalogue/useCatalogueData';
import { isCityInFreeList } from '../orders/orderUtils';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import type {
  AddressRow,
  PlaceOrderResponse,
  QuoteOrderLine,
} from '../../types/database';
import { Badge, Button, Card, Input, Textarea } from '../../components/ui';
import { PageHeader } from '../../components/common/PageHeader';
import { Seo } from '../../components/common/Seo';
import { cn } from '../../lib/utils';

interface PlacedOrderSnapshot {
  result: PlaceOrderResponse;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  addressLine: string;
  addressNotes: string;
  lines: QuoteOrderLine[];
}

export default function CheckoutPage() {
  const { t, i18n } = useTranslation();
  const { user, profile } = useAuth();
  const { settings } = useSiteSettings();
  const {
    items,
    selectedCity,
    setSelectedCity,
    couponCode,
    applyCoupon,
    removeCoupon,
    cities,
    quote,
    quoteLoading,
    schemaMissing,
    clearCart,
    fixCartProblems,
    refreshQuote,
  } = useCart();

  const lang = i18n.language;

  const [savedAddresses, setSavedAddresses] = useState<AddressRow[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [couponInput, setCouponInput] = useState<string>(couponCode);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrderSnapshot | null>(
    null
  );

  const schema = createCheckoutFormSchema(t);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_name: profile?.full_name ?? '',
      customer_phone: profile?.phone ?? '',
      customer_email: user?.email ?? '',
      city: selectedCity || 'Sadiqabad',
      address_line: '',
      address_notes: '',
      customer_notes: '',
      payment_method: 'cod',
      save_address: false,
      address_label: 'Home',
      honeypot: '',
    },
  });

  const watchedCity = watch('city');
  const watchedPaymentMethod = watch('payment_method');
  const watchedSaveAddress = watch('save_address');

  // Keep CartContext city synced with form city so delivery charge updates live
  useEffect(() => {
    if (watchedCity && watchedCity !== selectedCity) {
      setSelectedCity(watchedCity);
    }
  }, [watchedCity, selectedCity, setSelectedCity]);

  // Pre-fill profile & saved addresses when user is logged in
  useEffect(() => {
    if (profile?.full_name) {
      setValue('customer_name', profile.full_name);
    }
    if (profile?.phone) {
      setValue('customer_phone', profile.phone);
    }
    if (user?.email) {
      setValue('customer_email', user.email);
    }
  }, [profile, user, setValue]);

  useEffect(() => {
    if (!user || !env.isConfigured) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (!cancelled && !error && data && data.length > 0) {
        const list = data as AddressRow[];
        setSavedAddresses(list);
        const def = list.find((a) => a.is_default) ?? list[0];
        if (def) {
          setSelectedAddressId(def.id);
          setValue('customer_name', def.full_name);
          setValue('customer_phone', def.phone);
          setValue('city', def.city);
          setSelectedCity(def.city);
          setValue('address_line', def.address_line);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, setValue, setSelectedCity]);

  const handleSelectSavedAddress = (addr: AddressRow) => {
    setSelectedAddressId(addr.id);
    setValue('customer_name', addr.full_name, { shouldValidate: true });
    setValue('customer_phone', addr.phone, { shouldValidate: true });
    setValue('city', addr.city, { shouldValidate: true });
    setSelectedCity(addr.city);
    setValue('address_line', addr.address_line, { shouldValidate: true });
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    await applyCoupon(couponInput.trim());
  };

  const handleRemoveCoupon = () => {
    setCouponInput('');
    removeCoupon();
  };

  const onSubmit = async (values: CheckoutFormValues) => {
    // Honeypot anti-spam check
    if (values.honeypot && values.honeypot.trim().length > 0) {
      return;
    }

    if (items.length === 0) {
      setSubmitError(t('checkout.errors.empty_cart'));
      return;
    }

    if (quote.has_blocking_problems) {
      setSubmitError(t('checkout.errors.out_of_stock'));
      return;
    }

    if (values.payment_method === 'cod' && !quote.cod_allowed) {
      setSubmitError(t('checkout.errors.cod_not_allowed'));
      return;
    }

    if (values.payment_method === 'online' && !quote.online_payment_enabled) {
      setSubmitError(t('checkout.errors.online_unavailable'));
      return;
    }

    setSubmitError(null);

    try {
      const orderItemsPayload = items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      const snapshotLines = [...quote.lines];

      const { data, error } = await supabase.rpc('place_order', {
        p_items: orderItemsPayload,
        p_customer: {
          name: values.customer_name,
          phone: values.customer_phone,
          email: values.customer_email || null,
          notes: values.customer_notes || null,
        },
        p_city: values.city,
        p_address_line: values.address_line,
        p_address_notes: values.address_notes || null,
        p_payment_method: values.payment_method,
        p_coupon: quote.coupon_valid ? quote.coupon_code : null,
        p_language: lang,
      });

      if (error || !data) {
        const msg = error?.message ?? '';
        if (isMissingDatabaseObjectsError(error)) {
          setSubmitError(t('cart.schemaMissingDesc'));
        } else if (msg.includes('out_of_stock')) {
          setSubmitError(t('checkout.errors.out_of_stock'));
          void refreshQuote();
        } else if (msg.includes('invalid_coupon')) {
          setSubmitError(t('checkout.errors.invalid_coupon'));
          void refreshQuote();
        } else if (msg.includes('cod_not_allowed')) {
          setSubmitError(t('checkout.errors.cod_not_allowed'));
        } else if (msg.includes('online_unavailable')) {
          setSubmitError(t('checkout.errors.online_unavailable'));
        } else if (msg.includes('min_order')) {
          setSubmitError(
            t('checkout.errors.min_order', {
              min: formatPKRPrice(quote.min_order_amount),
            })
          );
        } else if (msg.includes('rate_limited')) {
          setSubmitError(t('checkout.errors.rate_limited'));
        } else if (msg.includes('empty_cart')) {
          setSubmitError(t('checkout.errors.empty_cart'));
        } else {
          setSubmitError(t('checkout.errors.invalid_input'));
        }
        return;
      }

      // Optionally save new address for logged-in user
      if (user && values.save_address) {
        try {
          await supabase.from('addresses').insert({
            user_id: user.id,
            label: values.address_label || 'Home',
            full_name: values.customer_name,
            phone: values.customer_phone,
            city: values.city,
            address_line: values.address_line,
            is_default: savedAddresses.length === 0,
          });
        } catch {
          // Non-blocking
        }
      }

      const placedResult = data as unknown as PlaceOrderResponse;
      setPlacedOrder({
        result: placedResult,
        customerName: values.customer_name,
        customerPhone: values.customer_phone,
        customerEmail: values.customer_email,
        addressLine: values.address_line,
        addressNotes: values.address_notes,
        lines: snapshotLines,
      });

      clearCart();
      toast.success(
        t('checkout.confirmation.toastSuccess', {
          orderNo: placedResult.order_no,
        })
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setSubmitError(t('checkout.errors.generic'));
    }
  };

  // =========================================================================
  // ORDER CONFIRMATION VIEW
  // =========================================================================
  if (placedOrder) {
    const { result, customerName, customerPhone, addressLine, addressNotes, lines } =
      placedOrder;
    const workshopWhatsapp =
      settings.whatsapp || settings.phone || '03126776844';
    const whatsappMsg = t('checkout.confirmation.whatsappMessage', {
      orderNo: result.order_no,
      name: customerName,
      city: result.city,
      total: formatPKRPrice(result.total),
    });

    const handleCopyOrderNo = () => {
      navigator.clipboard?.writeText(result.order_no);
      toast.success(t('checkout.confirmation.copiedToast'));
    };

    return (
      <div>
        <Seo
          title={`${t('checkout.confirmation.title')} — ${result.order_no}`}
          canonicalPath="/checkout"
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8 text-start">
          <Card className="p-6 sm:p-10 border-emerald-500/40 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <Badge variant="success">
                    {t('checkout.confirmation.badge')}
                  </Badge>
                  <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white mt-1">
                    {t('checkout.confirmation.title')}
                  </h1>
                  <p className="text-sm text-[#8A93A3] mt-1">
                    {t('checkout.confirmation.subtitle')}
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-[#0E1013] border border-[#FFC21A]/40 px-4 py-3 flex items-center gap-3 self-start">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#8A93A3] block">
                    {t('checkout.confirmation.orderNumberLabel')}
                  </span>
                  <span
                    dir="ltr"
                    className="text-xl font-mono font-extrabold text-[#FFC21A]"
                  >
                    {result.order_no}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyOrderNo}
                  className="p-2 rounded-md bg-[#1B1F26] hover:bg-[#2A2F38] text-[#F5F6F8] cursor-pointer"
                  title={t('checkout.confirmation.copyBtn')}
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Delivery & Payment Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg bg-[#0E1013] border border-white/10 p-4 space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8A93A3]">
                  {t('checkout.confirmation.shippingDetailsTitle')}
                </h2>
                <p className="text-sm font-bold text-white">{customerName}</p>
                <p dir="ltr" className="text-xs font-mono text-[#FFC21A]">
                  {customerPhone}
                </p>
                <p className="text-xs text-[#F5F6F8]">
                  {addressLine}, <strong className="text-white">{result.city}</strong>
                </p>
                {addressNotes && (
                  <p className="text-xs text-[#8A93A3]">{addressNotes}</p>
                )}
              </div>

              <div className="rounded-lg bg-[#0E1013] border border-white/10 p-4 space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8A93A3]">
                  {t('checkout.confirmation.paymentSummaryTitle')}
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant="warning">
                    {t(`orders.paymentMethods.${result.payment_method}`)}
                  </Badge>
                  <Badge variant="neutral">
                    {t(`orders.paymentStatuses.${result.payment_status}`)}
                  </Badge>
                </div>
                <p className="text-xs text-[#8A93A3] pt-1">
                  {t('checkout.confirmation.codPayOnDeliveryNote', {
                    amount: formatPKRPrice(result.total),
                  })}
                </p>
              </div>
            </div>

            {/* Ordered Items Table */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold font-heading text-white">
                {t('checkout.confirmation.itemsOrderedTitle')}
              </h2>
              <div className="rounded-lg bg-[#0E1013] border border-white/10 divide-y divide-white/10">
                {lines.map((line) => (
                  <div
                    key={line.product_id}
                    className="p-3.5 flex items-center justify-between gap-4 text-xs sm:text-sm"
                  >
                    <div>
                      <span
                        dir="ltr"
                        className="font-mono text-xs text-[#FFC21A] me-2"
                      >
                        {line.sku}
                      </span>
                      <span className="font-semibold text-white">
                        {getLocalized(line.name, lang) || line.sku}
                      </span>
                      <span dir="ltr" className="text-[#8A93A3] ms-2">
                        × {line.quantity}
                      </span>
                    </div>
                    <span
                      dir="ltr"
                      className="font-bold text-white tabular-nums shrink-0"
                    >
                      {formatPKRPrice(line.line_total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="rounded-lg bg-[#0E1013] border border-white/10 p-4 space-y-2 text-sm">
              <div className="flex justify-between text-[#8A93A3]">
                <span>{t('cart.subtotal')}</span>
                <span dir="ltr" className="text-white tabular-nums">
                  {formatPKRPrice(result.subtotal)}
                </span>
              </div>
              {Number(result.discount) > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>{t('cart.discount')}</span>
                  <span dir="ltr" className="tabular-nums">
                    -{formatPKRPrice(result.discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[#8A93A3]">
                <span>
                  {t('cart.delivery')} ({result.city})
                </span>
                {Number(result.delivery_charge) === 0 ? (
                  <span className="font-bold text-emerald-400">
                    {t('cart.freeDelivery')}
                  </span>
                ) : (
                  <span dir="ltr" className="text-white tabular-nums">
                    {formatPKRPrice(result.delivery_charge)}
                  </span>
                )}
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between text-base font-bold text-white">
                <span>{t('cart.total')}</span>
                <span dir="ltr" className="text-xl text-[#FFC21A] tabular-nums">
                  {formatPKRPrice(result.total)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 print:hidden">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to={`/track?tab=order&order=${encodeURIComponent(
                    result.order_no
                  )}&phone=${encodeURIComponent(customerPhone)}`}
                >
                  <Button
                    variant="primary"
                    leftIcon={<Search className="w-4 h-4" />}
                  >
                    {t('checkout.confirmation.trackOrderBtn')}
                  </Button>
                </Link>

                <a
                  href={buildWhatsAppUrl(workshopWhatsapp, whatsappMsg)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="secondary"
                    leftIcon={
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                    }
                  >
                    {t('checkout.confirmation.whatsappBtn')}
                  </Button>
                </a>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="w-4 h-4" />}
                >
                  {t('checkout.confirmation.printReceiptBtn')}
                </Button>
              </div>

              <Link to="/shop">
                <Button variant="ghost">
                  {t('cart.continueShoppingBtn')}
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // =========================================================================
  // EMPTY CART GUARD
  // =========================================================================
  if (items.length === 0) {
    return (
      <div>
        <Seo title={t('checkout.seoTitle')} canonicalPath="/checkout" />
        <PageHeader
          title={t('checkout.pageTitle')}
          subtitle={t('checkout.pageSubtitle')}
          breadcrumbs={[
            { label: t('nav.shopParts'), href: '/shop' },
            { label: t('routes.checkout') },
          ]}
        />
        <div className="max-w-3xl mx-auto px-4 py-14 text-center">
          <Card className="p-10 space-y-4">
            <ShoppingBag className="w-12 h-12 text-[#FF6A00] mx-auto" />
            <h2 className="text-xl font-bold text-white">
              {t('cart.emptyTitle')}
            </h2>
            <p className="text-sm text-[#8A93A3]">
              {t('cart.emptyDescription')}
            </p>
            <div className="pt-2">
              <Link to="/shop">
                <Button variant="primary">{t('cart.browsePartsBtn')}</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const isFreeCity = isCityInFreeList(selectedCity, quote.free_cities);

  return (
    <div>
      <Seo
        title={t('checkout.seoTitle')}
        description={t('checkout.seoDescription')}
        canonicalPath="/checkout"
      />

      <PageHeader
        title={t('checkout.pageTitle')}
        subtitle={t('checkout.pageSubtitle')}
        breadcrumbs={[
          { label: t('nav.shopParts'), href: '/shop' },
          { label: t('routes.cart'), href: '/cart' },
          { label: t('routes.checkout') },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 text-start">
        {schemaMissing && (
          <Card className="p-4 mb-6 border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#FFC21A] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h2 className="text-xs sm:text-sm font-bold text-white">
                {t('common.databaseSetupNeededTitle')}
              </h2>
              <p className="text-xs text-[#F5F6F8]/85">
                {t('cart.schemaMissingDesc')}
              </p>
            </div>
          </Card>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          noValidate
        >
          {/* Left 7 Columns: Customer, Delivery Address & Payment Method */}
          <div className="lg:col-span-7 space-y-6">
            {/* Saved Addresses Picker for Logged-in Customer */}
            {user && savedAddresses.length > 0 && (
              <Card className="p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFC21A]">
                    {t('checkout.savedAddressesTitle')}
                  </h2>
                  <Link
                    to="/account"
                    className="text-xs text-[#8A93A3] hover:text-white underline"
                  >
                    {t('checkout.manageAddressesLink')}
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={cn(
                          'rounded-lg p-3.5 text-start border transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-[#FF6A00]/15 border-[#FF6A00] text-white'
                            : 'bg-[#0E1013] border-white/10 text-[#F5F6F8] hover:border-white/30'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-[#FFC21A]">
                            {addr.label}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-400">
                            {addr.city}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-white truncate">
                          {addr.full_name} ({addr.phone})
                        </p>
                        <p className="text-xs text-[#8A93A3] line-clamp-2 mt-0.5">
                          {addr.address_line}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* 1. Customer & Delivery Details */}
            <Card className="p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
                <MapPin className="w-5 h-5 text-[#FF6A00]" />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold font-heading text-white">
                    {t('checkout.deliverySectionTitle')}
                  </h2>
                  <p className="text-xs text-[#8A93A3]">
                    {t('checkout.deliverySectionSubtitle')}
                  </p>
                </div>
              </div>

              {/* Hidden Honeypot */}
              <div className="hidden" aria-hidden="true">
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  {...register('honeypot')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('checkout.fields.fullName')}
                  placeholder={t('checkout.fields.fullNamePlaceholder')}
                  error={errors.customer_name?.message}
                  required
                  {...register('customer_name')}
                />

                <Input
                  label={t('checkout.fields.phone')}
                  dir="ltr"
                  type="tel"
                  placeholder="03126776844"
                  error={errors.customer_phone?.message}
                  required
                  {...register('customer_phone')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('checkout.fields.email')}
                  dir="ltr"
                  type="email"
                  placeholder="name@example.com"
                  error={errors.customer_email?.message}
                  {...register('customer_email')}
                />

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[#F5F6F8] mb-1.5">
                    {t('checkout.fields.city')} *
                  </label>
                  <select
                    className="w-full rounded-md bg-[#0E1013] border border-white/15 px-3.5 py-2.5 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]"
                    {...register('city')}
                  >
                    {cities.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.province}){' '}
                        {isCityInFreeList(c.name, quote.free_cities)
                          ? `— ${t('cart.freeDelivery')}`
                          : `— ${formatPKRPrice(quote.flat_rate)}`}
                      </option>
                    ))}
                  </select>
                  {errors.city?.message && (
                    <p className="text-xs text-red-400 mt-1">
                      {errors.city.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Dynamic City Delivery Rule Callout */}
              <div
                className={cn(
                  'rounded-lg p-3.5 border flex items-center gap-3 text-xs sm:text-sm',
                  isFreeCity
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : 'bg-[#0E1013] border-white/10 text-[#F5F6F8]'
                )}
              >
                <Truck
                  className={cn(
                    'w-5 h-5 shrink-0',
                    isFreeCity ? 'text-emerald-400' : 'text-[#FFC21A]'
                  )}
                />
                <span>
                  {isFreeCity
                    ? t('cart.freeCityRuleNotice', { city: selectedCity })
                    : t('cart.flatRateRuleNotice', {
                        rate: formatPKRPrice(quote.flat_rate),
                        freeCities: quote.free_cities.join(', '),
                      })}
                </span>
              </div>

              <Textarea
                label={t('checkout.fields.addressLine')}
                rows={2}
                placeholder={t('checkout.fields.addressLinePlaceholder')}
                error={errors.address_line?.message}
                required
                {...register('address_line')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('checkout.fields.addressNotes')}
                  placeholder={t('checkout.fields.addressNotesPlaceholder')}
                  error={errors.address_notes?.message}
                  {...register('address_notes')}
                />

                <Input
                  label={t('checkout.fields.customerNotes')}
                  placeholder={t('checkout.fields.customerNotesPlaceholder')}
                  error={errors.customer_notes?.message}
                  {...register('customer_notes')}
                />
              </div>

              {user && (
                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#F5F6F8] cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[#FF6A00] rounded"
                      {...register('save_address')}
                    />
                    <span>{t('checkout.fields.saveAddressToggle')}</span>
                  </label>

                  {watchedSaveAddress && (
                    <input
                      type="text"
                      placeholder={t('checkout.fields.addressLabelPlaceholder')}
                      className="rounded-md bg-[#0E1013] border border-white/15 px-3 py-1.5 text-xs text-white"
                      {...register('address_label')}
                    />
                  )}
                </div>
              )}
            </Card>

            {/* 2. Payment Method Section (COD + Online Disabled until Phase 7) */}
            <Card className="p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
                <Banknote className="w-5 h-5 text-[#FF6A00]" />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold font-heading text-white">
                    {t('checkout.paymentSectionTitle')}
                  </h2>
                  <p className="text-xs text-[#8A93A3]">
                    {t('checkout.paymentSectionSubtitle')}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Option 1: Cash on Delivery (COD) */}
                <label
                  className={cn(
                    'rounded-lg border p-4 flex items-start gap-3.5 transition-colors',
                    !quote.cod_allowed
                      ? 'opacity-60 bg-[#0E1013] border-white/10 cursor-not-allowed'
                      : watchedPaymentMethod === 'cod'
                        ? 'bg-[#FF6A00]/10 border-[#FF6A00] cursor-pointer'
                        : 'bg-[#0E1013] border-white/15 hover:border-white/30 cursor-pointer'
                  )}
                >
                  <input
                    type="radio"
                    value="cod"
                    disabled={!quote.cod_allowed}
                    className="mt-1 w-4 h-4 accent-[#FF6A00]"
                    {...register('payment_method')}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm sm:text-base font-bold text-white">
                        {t('checkout.payment.codTitle')}
                      </span>
                      <Badge variant={quote.cod_allowed ? 'success' : 'danger'}>
                        {quote.cod_allowed
                          ? t('checkout.payment.codAvailableBadge')
                          : t('checkout.payment.codUnavailableBadge')}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#8A93A3]">
                      {t('checkout.payment.codDescription')}
                    </p>
                    {!quote.cod_allowed && quote.cod_reason && (
                      <p className="text-xs font-semibold text-red-400 pt-1">
                        {t(`checkout.payment.codBlockedReasons.${quote.cod_reason}`, {
                          city: selectedCity,
                          max: quote.cod_max_amount
                            ? formatPKRPrice(quote.cod_max_amount)
                            : '',
                        })}
                      </p>
                    )}
                  </div>
                </label>

                {/* Option 2: Online Payment (JazzCash / EasyPaisa / Bank Transfer / Card — Phase 7) */}
                <label
                  className={cn(
                    'rounded-lg border p-4 flex items-start gap-3.5 transition-colors',
                    !quote.online_payment_enabled
                      ? 'opacity-65 bg-[#0E1013]/80 border-white/10 cursor-not-allowed select-none'
                      : watchedPaymentMethod === 'online'
                        ? 'bg-[#FF6A00]/10 border-[#FF6A00] cursor-pointer'
                        : 'bg-[#0E1013] border-white/15 hover:border-white/30 cursor-pointer'
                  )}
                >
                  <input
                    type="radio"
                    value="online"
                    disabled={!quote.online_payment_enabled}
                    className="mt-1 w-4 h-4 accent-[#FF6A00]"
                    {...register('payment_method')}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-white">
                        <CreditCard className="w-4 h-4 text-[#FFC21A]" />
                        <span>{t('checkout.payment.onlineTitle')}</span>
                      </span>
                      <Badge
                        variant={
                          quote.online_payment_enabled ? 'primary' : 'neutral'
                        }
                      >
                        {quote.online_payment_enabled
                          ? t('checkout.payment.onlineEnabledBadge')
                          : t('checkout.payment.onlinePhase7Badge')}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#8A93A3]">
                      {t('checkout.payment.onlineDescription')}
                    </p>
                  </div>
                </label>
              </div>
            </Card>
          </div>

          {/* Right 5 Columns: Order Summary & Submit */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <Card className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-lg font-bold font-heading text-white">
                  {t('checkout.orderSummaryTitle')}
                </h2>
                <Link
                  to="/cart"
                  className="text-xs font-semibold text-[#FF6A00] hover:underline"
                >
                  {t('checkout.editCartLink')}
                </Link>
              </div>

              {/* Blocking problems alert */}
              {quote.has_blocking_problems && (
                <div className="rounded-md bg-red-500/15 border border-red-500/40 p-3.5 space-y-2">
                  <div className="flex items-start gap-2 text-xs text-red-200">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{t('cart.blockingProblemsBanner')}</span>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={fixCartProblems}
                    className="w-full"
                  >
                    {t('cart.fixProblemsBtn')}
                  </Button>
                </div>
              )}

              {/* Compact Items List */}
              <div className="max-h-72 overflow-y-auto space-y-3 pe-1">
                {quote.lines.map((line) => {
                  const lineName = getLocalized(line.name, lang) || line.sku;
                  return (
                    <div
                      key={line.product_id}
                      className="flex items-center justify-between gap-3 text-xs sm:text-sm border-b border-white/5 pb-2.5"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">
                          {lineName}
                        </p>
                        <p dir="ltr" className="text-[11px] text-[#8A93A3]">
                          {line.sku} • {formatPKRPrice(line.unit_price)} ×{' '}
                          {line.quantity}
                        </p>
                      </div>
                      <span
                        dir="ltr"
                        className="font-bold text-[#FFC21A] tabular-nums shrink-0"
                      >
                        {formatPKRPrice(line.line_total)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Input inside Checkout */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8A93A3]">
                  <Tag className="w-3.5 h-3.5 text-[#FF6A00]" />
                  <span>{t('cart.coupon.title')}</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    dir="ltr"
                    value={couponInput}
                    onChange={(e) =>
                      setCouponInput(e.target.value.toUpperCase())
                    }
                    placeholder={t('cart.coupon.placeholder')}
                    className="flex-1 rounded-md bg-[#0E1013] border border-white/15 px-3 py-2 text-xs font-mono uppercase text-white placeholder:text-[#8A93A3]"
                  />
                  {couponCode ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveCoupon}
                      leftIcon={<X className="w-3.5 h-3.5" />}
                    >
                      {t('cart.coupon.removeBtn')}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={!couponInput.trim() || quoteLoading}
                      onClick={handleApplyCoupon}
                    >
                      {t('cart.coupon.applyBtn')}
                    </Button>
                  )}
                </div>
                {couponCode && quote.coupon_valid && (
                  <p className="text-xs text-emerald-400 font-semibold">
                    {t('cart.coupon.appliedSuccess', {
                      code: quote.coupon_code,
                      amount: formatPKRPrice(quote.discount),
                    })}
                  </p>
                )}
                {couponCode && !quote.coupon_valid && quote.coupon_error && (
                  <p className="text-xs text-red-400">
                    {t(`cart.coupon.errors.${quote.coupon_error}`, {
                      minOrder: quote.coupon_min_order
                        ? formatPKRPrice(quote.coupon_min_order)
                        : '',
                    })}
                  </p>
                )}
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-2.5 pt-3 border-t border-white/10 text-sm">
                <div className="flex items-center justify-between text-[#8A93A3]">
                  <span>{t('cart.subtotal')}</span>
                  <span dir="ltr" className="font-semibold text-white tabular-nums">
                    {formatPKRPrice(quote.subtotal)}
                  </span>
                </div>

                {quote.discount > 0 && (
                  <div className="flex items-center justify-between text-emerald-400">
                    <span>
                      {t('cart.discount')}{' '}
                      {quote.coupon_code ? `(${quote.coupon_code})` : ''}
                    </span>
                    <span dir="ltr" className="font-semibold tabular-nums">
                      -{formatPKRPrice(quote.discount)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[#8A93A3]">
                  <span>
                    {t('cart.delivery')} ({selectedCity})
                  </span>
                  {quote.delivery_charge === 0 ? (
                    <Badge variant="success">{t('cart.freeDelivery')}</Badge>
                  ) : (
                    <span dir="ltr" className="font-semibold text-white tabular-nums">
                      {formatPKRPrice(quote.delivery_charge)}
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-base font-bold text-white">
                    {t('cart.total')}
                  </span>
                  <span
                    dir="ltr"
                    className="text-2xl font-extrabold text-[#FFC21A] tabular-nums"
                  >
                    {formatPKRPrice(quote.total)}
                  </span>
                </div>
              </div>

              {submitError && (
                <div
                  role="alert"
                  className="rounded-md bg-red-500/15 border border-red-500/40 p-3.5 flex items-start gap-2.5 text-xs sm:text-sm text-red-200"
                >
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
                disabled={
                  isSubmitting ||
                  quote.has_blocking_problems ||
                  !quote.meets_min_order ||
                  (watchedPaymentMethod === 'cod' && !quote.cod_allowed) ||
                  (watchedPaymentMethod === 'online' &&
                    !quote.online_payment_enabled)
                }
                leftIcon={<ShieldCheck className="w-5 h-5" />}
              >
                {isSubmitting
                  ? t('checkout.placingOrderBtn')
                  : t('checkout.placeOrderBtn', {
                      total: formatPKRPrice(quote.total),
                    })}
              </Button>

              <div className="flex items-center justify-between text-xs text-[#8A93A3] pt-1">
                <Link
                  to="/cart"
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  <ArrowLeft className="w-3.5 h-3.5 rtl-flip" />
                  <span>{t('checkout.backToCart')}</span>
                </Link>
                <Link to="/delivery-policy" className="hover:text-white underline">
                  {t('footer.delivery')}
                </Link>
              </div>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
