import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { useCart, MAX_CART_UNITS_PER_LINE } from './CartContext';
import { getLocalized } from '../../i18n/helpers';
import { formatPKRPrice } from '../catalogue/useCatalogueData';
import { CategoryIllustration } from '../catalogue/CategoryIllustration';
import { isCityInFreeList } from '../orders/orderUtils';
import { Button } from '../../components/ui/Button';

export function CartDrawer() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const {
    items,
    totalUnitCount,
    selectedCity,
    setSelectedCity,
    cities,
    quote,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    fixCartProblems,
  } = useCart();

  const lang = i18n.language;

  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) return null;

  const isFreeCity = isCityInFreeList(selectedCity, quote.free_cities);

  const handleProceedCheckout = () => {
    closeDrawer();
    navigate('/checkout');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={t('cart.drawerTitle')}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative z-10 w-full max-w-md bg-[#1B1F26] border-s border-white/15 h-full flex flex-col justify-between text-[#F5F6F8] shadow-2xl">
        {/* Top Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-[#FF6A00]/15 border border-[#FF6A00]/30 flex items-center justify-center text-[#FF6A00]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-heading text-white leading-tight">
                {t('cart.drawerTitle')}
              </h2>
              <p className="text-xs text-[#8A93A3]">
                {t('cart.itemsCount', { count: totalUnitCount })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeDrawer}
            aria-label={t('common.close')}
            className="p-2 rounded-md text-[#8A93A3] hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* City Delivery Rule Selector Strip */}
        <div className="px-4 sm:px-5 py-3 bg-[#0E1013] border-b border-white/10 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="drawer-city-select"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F5F6F8]"
            >
              <MapPin className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span>{t('cart.deliveryCityLabel')}:</span>
            </label>

            <select
              id="drawer-city-select"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="rounded-md bg-[#1B1F26] border border-white/15 px-2.5 py-1 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}{' '}
                  {isCityInFreeList(c.name, quote.free_cities)
                    ? `(${t('cart.freeBadge')})`
                    : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {isFreeCity ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  {t('cart.freeCityRuleNotice', { city: selectedCity })}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[#8A93A3]">
                <Truck className="w-3.5 h-3.5 text-[#FFC21A] shrink-0" />
                <span>
                  {t('cart.flatRateRuleNotice', {
                    rate: formatPKRPrice(quote.flat_rate),
                    freeCities: quote.free_cities.join(', '),
                  })}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Cart Lines Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-start">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#2A2F38] flex items-center justify-center text-[#8A93A3]">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  {t('cart.emptyTitle')}
                </h3>
                <p className="text-xs text-[#8A93A3] max-w-xs">
                  {t('cart.emptyDescription')}
                </p>
              </div>
              <Link to="/shop" onClick={closeDrawer}>
                <Button variant="primary" size="sm">
                  {t('cart.browsePartsBtn')}
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {quote.has_blocking_problems && (
                <div className="rounded-md bg-red-500/15 border border-red-500/40 p-3 space-y-2">
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

              {quote.lines.map((line) => {
                const lineName = getLocalized(line.name, lang) || line.sku;
                const maxQty = Math.min(
                  MAX_CART_UNITS_PER_LINE,
                  Math.max(1, line.available_stock)
                );
                const hasOut = line.problems.includes('out_of_stock');
                const hasInactive = line.problems.includes('inactive');

                return (
                  <div
                    key={line.product_id}
                    className="rounded-md bg-[#0E1013] border border-white/10 p-3 flex gap-3"
                  >
                    <Link
                      to={`/shop/product/${line.slug}`}
                      onClick={closeDrawer}
                      className="w-16 h-16 rounded-md bg-slate-900 border border-white/10 overflow-hidden shrink-0"
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

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/shop/product/${line.slug}`}
                          onClick={closeDrawer}
                          className="text-xs sm:text-sm font-bold text-white hover:text-[#FF6A00] line-clamp-2 leading-snug"
                        >
                          {lineName}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(line.product_id)}
                          aria-label={t('cart.removeItem')}
                          className="p-1 text-[#8A93A3] hover:text-red-400 transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#8A93A3]">
                        <span dir="ltr" className="font-mono">
                          {line.sku}
                        </span>
                        <span dir="ltr" className="tabular-nums">
                          {formatPKRPrice(line.unit_price)} × {line.quantity}
                        </span>
                      </div>

                      {(hasOut || hasInactive) && (
                        <div className="text-[11px] font-semibold text-red-400">
                          {hasInactive
                            ? t('cart.lineProblems.inactive')
                            : t('cart.lineProblems.outOfStock', {
                                available: line.available_stock,
                              })}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <div className="inline-flex items-center rounded-md bg-[#1B1F26] border border-white/15">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(line.product_id, line.quantity - 1)
                            }
                            aria-label={t('cart.decreaseQty')}
                            className="p-1.5 text-[#F5F6F8] hover:text-[#FF6A00] cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span
                            dir="ltr"
                            className="px-2.5 text-xs font-bold tabular-nums text-white"
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
                            className="p-1.5 text-[#F5F6F8] hover:text-[#FF6A00] disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span
                          dir="ltr"
                          className="text-sm font-bold text-[#FFC21A] tabular-nums"
                        >
                          {formatPKRPrice(line.line_total)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Bottom Totals & Actions */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-[#0E1013] border-t border-white/15 space-y-4">
            <div className="space-y-1.5 text-xs sm:text-sm">
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
                  <span className="font-bold text-emerald-400">
                    {t('cart.freeDelivery')}
                  </span>
                ) : (
                  <span dir="ltr" className="font-semibold text-white tabular-nums">
                    {formatPKRPrice(quote.delivery_charge)}
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-base font-bold text-white">
                <span>{t('cart.total')}</span>
                <span dir="ltr" className="text-lg text-[#FFC21A] tabular-nums">
                  {formatPKRPrice(quote.total)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Link to="/cart" onClick={closeDrawer} className="block">
                <Button variant="secondary" className="w-full">
                  {t('cart.viewFullCartBtn')}
                </Button>
              </Link>

              <Button
                type="button"
                variant="primary"
                disabled={quote.has_blocking_problems}
                onClick={handleProceedCheckout}
                rightIcon={<ArrowRight className="w-4 h-4 rtl-flip" />}
                className="w-full"
              >
                {t('cart.checkoutBtn')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
