import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { useCart, MAX_CART_UNITS_PER_LINE } from './CartContext';
import { useSiteSettings } from '../settings/useSiteSettings';
import { getLocalized } from '../../i18n/helpers';
import { formatPKRPrice } from '../catalogue/useCatalogueData';
import { CategoryIllustration } from '../catalogue/CategoryIllustration';
import { getPartOriginBadgeStyle } from '../catalogue/ProductCard';
import { DEMO_COUPON_SAMPLES, isCityInFreeList } from '../orders/orderUtils';
import { Badge, Button, Card } from '../../components/ui';
import { PageHeader } from '../../components/common/PageHeader';
import { Seo } from '../../components/common/Seo';

export default function CartPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const {
    items,
    totalUnitCount,
    selectedCity,
    setSelectedCity,
    couponCode,
    applyCoupon,
    removeCoupon,
    cities,
    quote,
    quoteLoading,
    schemaMissing,
    updateQuantity,
    removeItem,
    clearCart,
    fixCartProblems,
  } = useCart();

  const [couponInput, setCouponInput] = useState<string>(couponCode);
  const lang = i18n.language;
  const isFreeCity = isCityInFreeList(selectedCity, quote.free_cities);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    await applyCoupon(couponInput.trim());
  };

  const handleQuickDemoCoupon = async (code: string) => {
    setCouponInput(code);
    await applyCoupon(code);
  };

  const handleRemoveCoupon = () => {
    setCouponInput('');
    removeCoupon();
  };

  return (
    <div>
      <Seo
        title={t('cart.seoTitle')}
        description={t('cart.seoDescription')}
        canonicalPath="/cart"
      />

      <PageHeader
        title={t('cart.pageTitle')}
        subtitle={t('cart.pageSubtitle')}
        breadcrumbs={[
          { label: t('nav.shopParts'), href: '/shop' },
          { label: t('routes.cart') },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-8 text-start">
        {schemaMissing && (
          <Card className="p-4 border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
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

        {/* Delivery Rule Highlight Banner */}
        <Card className="p-4 sm:p-5 border-emerald-500/30 bg-emerald-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                {t('cart.deliveryBannerTitle', {
                  freeCities: quote.free_cities.join(', '),
                  flatRate: formatPKRPrice(quote.flat_rate),
                })}
              </h2>
              <p className="text-xs text-[#8A93A3] mt-0.5">
                {isFreeCity
                  ? t('cart.freeCityRuleNotice', { city: selectedCity })
                  : t('cart.flatRateRuleNotice', {
                      rate: formatPKRPrice(quote.flat_rate),
                      freeCities: quote.free_cities.join(', '),
                    })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <MapPin className="w-4 h-4 text-[#FF6A00]" />
            <label htmlFor="cart-page-city" className="text-xs text-[#8A93A3]">
              {t('cart.deliveryCityLabel')}:
            </label>
            <select
              id="cart-page-city"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="rounded-md bg-[#0E1013] border border-white/15 px-3 py-2 text-xs sm:text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} — {c.province}{' '}
                  {isCityInFreeList(c.name, quote.free_cities)
                    ? `(${t('cart.freeBadge')})`
                    : ''}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {items.length === 0 ? (
          <Card className="p-10 sm:p-14 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#2A2F38] flex items-center justify-center text-[#FF6A00] mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
                {t('cart.emptyTitle')}
              </h2>
              <p className="text-sm text-[#8A93A3]">
                {t('cart.emptyDescription')}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link to="/shop">
                <Button
                  variant="primary"
                  leftIcon={<ShoppingBag className="w-4 h-4" />}
                >
                  {t('cart.browsePartsBtn')}
                </Button>
              </Link>
              <Link to="/track?tab=order">
                <Button variant="secondary">
                  {t('cart.trackExistingOrderBtn')}
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Columns: Line Items */}
            <div className="lg:col-span-8 space-y-4">
              {quote.has_blocking_problems && (
                <Card className="p-4 border-red-500/40 bg-red-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 text-sm text-red-200">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <span>{t('cart.blockingProblemsBanner')}</span>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={fixCartProblems}
                  >
                    {t('cart.fixProblemsBtn')}
                  </Button>
                </Card>
              )}

              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-heading text-white">
                  {t('cart.itemsHeading', { count: totalUnitCount })}
                </h2>
                <button
                  type="button"
                  onClick={clearCart}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8A93A3] hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('cart.clearCartBtn')}</span>
                </button>
              </div>

              <div className="space-y-3">
                {quote.lines.map((line) => {
                  const lineName = getLocalized(line.name, lang) || line.sku;
                  const maxQty = Math.min(
                    MAX_CART_UNITS_PER_LINE,
                    Math.max(1, line.available_stock)
                  );
                  const hasOut = line.problems.includes('out_of_stock');
                  const hasInactive = line.problems.includes('inactive');
                  const hasPriceChanged = line.problems.includes('price_changed');

                  return (
                    <Card
                      key={line.product_id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        <Link
                          to={`/shop/product/${line.slug}`}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-slate-900 border border-white/10 overflow-hidden shrink-0"
                        >
                          {line.primary_image_url ? (
                            <img
                              src={line.primary_image_url}
                              alt={lineName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <CategoryIllustration sku={line.sku} />
                          )}
                        </Link>

                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              dir="ltr"
                              className="text-xs font-mono font-bold text-[#FFC21A]"
                            >
                              {line.sku}
                            </span>
                            {line.part_origin && (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getPartOriginBadgeStyle(
                                  line.part_origin
                                )}`}
                              >
                                {t(`catalogue.origins.${line.part_origin}`)}
                              </span>
                            )}
                          </div>

                          <Link
                            to={`/shop/product/${line.slug}`}
                            className="text-base font-bold text-white hover:text-[#FF6A00] transition-colors block"
                          >
                            {lineName}
                          </Link>

                          <div
                            dir="ltr"
                            className="text-xs sm:text-sm text-[#8A93A3] tabular-nums"
                          >
                            {formatPKRPrice(line.unit_price)} {t('cart.each')}
                          </div>

                          {hasInactive && (
                            <p className="text-xs font-semibold text-red-400">
                              {t('cart.lineProblems.inactive')}
                            </p>
                          )}
                          {hasOut && (
                            <p className="text-xs font-semibold text-red-400">
                              {t('cart.lineProblems.outOfStock', {
                                available: line.available_stock,
                              })}
                            </p>
                          )}
                          {hasPriceChanged && (
                            <p className="text-xs font-semibold text-amber-300">
                              {t('cart.lineProblems.priceChanged')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/10">
                        <div className="inline-flex items-center rounded-md bg-[#0E1013] border border-white/15">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(line.product_id, line.quantity - 1)
                            }
                            aria-label={t('cart.decreaseQty')}
                            className="p-2 text-[#F5F6F8] hover:text-[#FF6A00] cursor-pointer"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span
                            dir="ltr"
                            className="px-3.5 text-sm font-bold tabular-nums text-white"
                          >
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={line.quantity >= maxQty}
                            onClick={() =>
                              updateQuantity(line.product_id, line.quantity + 1)
                            }
                            aria-label={t('cart.increaseQty')}
                            className="p-2 text-[#F5F6F8] hover:text-[#FF6A00] disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-end min-w-[100px]">
                          <div
                            dir="ltr"
                            className="text-base font-bold text-[#FFC21A] tabular-nums"
                          >
                            {formatPKRPrice(line.line_total)}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(line.product_id)}
                          aria-label={t('cart.removeItem')}
                          className="p-2 rounded-md text-[#8A93A3] hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="pt-2">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#8A93A3] hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 rtl-flip" />
                  <span>{t('cart.continueShoppingBtn')}</span>
                </Link>
              </div>
            </div>

            {/* Right 4 Columns: Coupon & Order Summary */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              {/* Coupon Box */}
              <Card className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#FF6A00]" />
                  <h3 className="text-sm sm:text-base font-bold font-heading text-white">
                    {t('cart.coupon.title')}
                  </h3>
                </div>

                {settings.demo_mode && (
                  <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300">
                      <FlaskConical className="w-3.5 h-3.5 text-[#FFC21A]" />
                      <span>{t('cart.coupon.demoSamplesTitle')}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {DEMO_COUPON_SAMPLES.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => void handleQuickDemoCoupon(c.code)}
                          className="inline-flex items-center gap-1.5 rounded bg-[#0E1013] hover:bg-[#2A2F38] border border-amber-500/30 px-2 py-1 text-[11px] text-white cursor-pointer"
                        >
                          <span dir="ltr" className="font-mono font-bold text-[#FFC21A]">
                            {c.code}
                          </span>
                          <span className="text-[#8A93A3]">• {c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    dir="ltr"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder={t('cart.coupon.placeholder')}
                    className="flex-1 rounded-md bg-[#0E1013] border border-white/15 px-3 py-2 text-xs sm:text-sm font-mono uppercase text-white placeholder:text-[#8A93A3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]"
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
                      type="submit"
                      variant="secondary"
                      size="sm"
                      disabled={!couponInput.trim() || quoteLoading}
                    >
                      {t('cart.coupon.applyBtn')}
                    </Button>
                  )}
                </form>

                {couponCode && quote.coupon_valid && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      {t('cart.coupon.appliedSuccess', {
                        code: quote.coupon_code,
                        amount: formatPKRPrice(quote.discount),
                      })}
                    </span>
                  </div>
                )}

                {couponCode && !quote.coupon_valid && quote.coupon_error && (
                  <div className="flex items-start gap-2 text-xs text-red-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      {t(`cart.coupon.errors.${quote.coupon_error}`, {
                        minOrder: quote.coupon_min_order
                          ? formatPKRPrice(quote.coupon_min_order)
                          : '',
                      })}
                    </span>
                  </div>
                )}
              </Card>

              {/* Order Summary Card */}
              <Card className="p-5 sm:p-6 space-y-5">
                <h3 className="text-base sm:text-lg font-bold font-heading text-white border-b border-white/10 pb-3">
                  {t('cart.summaryTitle')}
                </h3>

                <div className="space-y-2.5 text-sm">
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
                      className="text-xl font-extrabold text-[#FFC21A] tabular-nums"
                    >
                      {formatPKRPrice(quote.total)}
                    </span>
                  </div>
                </div>

                {!quote.meets_min_order && quote.min_order_amount > 0 && (
                  <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-200">
                    {t('cart.minOrderNotice', {
                      min: formatPKRPrice(quote.min_order_amount),
                    })}
                  </div>
                )}

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={
                    quote.has_blocking_problems || !quote.meets_min_order
                  }
                  onClick={() => navigate('/checkout')}
                  rightIcon={<ArrowRight className="w-4 h-4 rtl-flip" />}
                >
                  {t('cart.proceedToCheckoutBtn')}
                </Button>

                <div className="pt-2 border-t border-white/10 space-y-2 text-xs text-[#8A93A3]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t('cart.codAvailableNote')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#FF6A00] shrink-0" />
                    <span>
                      {t('cart.deliveryRuleShort', {
                        freeCities: quote.free_cities.join(', '),
                        rate: formatPKRPrice(quote.flat_rate),
                      })}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
