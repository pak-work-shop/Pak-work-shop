import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  MessageCircle,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';
import type { PartOrigin, SearchProductItem } from '../../types/database';
import { getLocalized } from '../../i18n/helpers';
import { useSiteSettings } from '../settings/SiteSettingsContext';
import { useCart } from '../cart/CartContext';
import { useVehicleFilter } from './VehicleFilterContext';
import { CategoryIllustration } from './CategoryIllustration';
import { computeDiscountPercent, formatPKRPrice } from './useCatalogueData';
import { buildWhatsAppUrl } from '../../lib/utils';

export function getPartOriginBadgeStyle(origin: PartOrigin): string {
  switch (origin) {
    case 'genuine_oem':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'japanese_imported':
      return 'bg-sky-50 text-sky-800 border-sky-200';
    case 'aftermarket':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'local':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function ProductCard({ product }: { product: SearchProductItem }) {
  const { t, i18n } = useTranslation();
  const { settings } = useSiteSettings();
  const { selectedVehicle } = useVehicleFilter();
  const { addItem, getItemQuantity } = useCart();

  const lang = i18n.language;
  const title = getLocalized(product.name, lang) || product.sku;
  const discountPct = computeDiscountPercent(
    product.price,
    product.compare_at_price
  );

  // Stock badge logic
  const isOutOfStock = product.stock_qty <= 0;
  const isLowStock =
    product.stock_qty > 0 && product.stock_qty <= product.low_stock_threshold;
  const inCartQty = getItemQuantity(product.id);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(
      {
        product_id: product.id,
        sku: product.sku,
        slug: product.slug,
        name: product.name,
        unit_price: Number(product.price),
        compare_at_price:
          product.compare_at_price !== null
            ? Number(product.compare_at_price)
            : null,
        primary_image_url: product.primary_image_url,
        part_origin: product.part_origin,
        stock_qty: product.stock_qty,
      },
      1,
      true
    );
  };

  // WhatsApp quick inquiry link
  const whatsappNumber =
    settings.whatsapp || settings.phone || '03126776844';
  const whatsappMessage = t('catalogue.whatsappInquiryMessage', {
    name: getLocalized(product.name, 'en') || title,
    sku: product.sku,
    price: formatPKRPrice(product.price),
  });
  const whatsappUrl = whatsappNumber
    ? buildWhatsAppUrl(whatsappNumber, whatsappMessage)
    : null;

  const selectedCarShortName = selectedVehicle
    ? [selectedVehicle.makeName, selectedVehicle.modelName, selectedVehicle.year]
        .filter(Boolean)
        .join(' ')
    : null;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* 1:1 Image Frame */}
      <Link
        to={`/shop/product/${product.slug}`}
        className="relative aspect-square w-full bg-slate-900 overflow-hidden block"
      >
        {product.primary_image_url ? (
          <img
            src={product.primary_image_url}
            alt={product.primary_image_alt || title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <CategoryIllustration
            slug={product.category_slug}
            iconName={product.category_icon}
            sku={product.sku}
            className="group-hover:scale-105 transition-transform duration-300"
          />
        )}

        {/* Top Badges Overlay */}
        <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-2 pointer-events-none">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border shadow-xs ${getPartOriginBadgeStyle(
              product.part_origin
            )}`}
          >
            {t(`catalogue.origins.${product.part_origin}`)}
          </span>

          {discountPct && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-600 text-white shadow-xs">
              -{discountPct}%
            </span>
          )}
        </div>

        {/* Stock Pill at Bottom Left of Image */}
        <div className="absolute bottom-3 start-3 pointer-events-none">
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-900/90 text-rose-300 border border-rose-500/40 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              {t('catalogue.stock.outOfStock')}
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-900/90 text-amber-300 border border-amber-500/40 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {t('catalogue.stock.lowStockCount', { count: product.stock_qty })}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-900/85 text-emerald-300 border border-emerald-500/30 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {t('catalogue.stock.inStock')}
            </span>
          )}
        </div>
      </Link>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* Brand & SKU Row */}
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-slate-700 truncate">
              {product.brand_name || t('catalogue.genericBrand')}
            </span>
            <span className="font-mono text-[11px] text-slate-400 shrink-0">
              {product.sku}
            </span>
          </div>

          {/* Product Name (2-line clamp) */}
          <Link
            to={`/shop/product/${product.slug}`}
            className="text-base font-bold text-slate-900 hover:text-red-600 transition-colors line-clamp-2 leading-snug"
          >
            {title}
          </Link>

          {/* Compatibility Pill */}
          <div className="mt-2.5">
            {selectedVehicle && product.matches_selected_vehicle ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  {t('catalogue.compatibility.fitsYourCar', {
                    car: selectedCarShortName,
                  })}
                </span>
              </span>
            ) : product.is_universal ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{t('catalogue.compatibility.universalFit')}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{t('catalogue.compatibility.checkCompatibility')}</span>
              </span>
            )}
          </div>
        </div>

        {/* Price & Actions Footer */}
        <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <div className="text-lg font-extrabold text-slate-900">
                {formatPKRPrice(product.price)}
              </div>
              {product.compare_at_price &&
                Number(product.compare_at_price) > Number(product.price) && (
                  <div className="text-xs text-slate-400 line-through">
                    {formatPKRPrice(product.compare_at_price)}
                  </div>
                )}
            </div>
            {product.warranty && (
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[130px]">
                {product.warranty}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#FF6A00] hover:bg-[#E05E00] disabled:bg-slate-200 disabled:text-slate-500 text-white transition-colors cursor-pointer disabled:cursor-not-allowed shadow-xs"
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span>
              {isOutOfStock
                ? t('catalogue.stock.outOfStock')
                : inCartQty > 0
                  ? t('cart.inCartAddMore', { count: inCartQty })
                  : t('cart.addToCartBtn')}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/shop/product/${product.slug}`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              <span>{t('catalogue.viewDetails')}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t('catalogue.askOnWhatsApp')}</span>
              </a>
            ) : (
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t('catalogue.inquireNow')}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
