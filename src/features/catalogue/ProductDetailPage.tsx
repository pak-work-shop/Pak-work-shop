import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Car,
  CheckCircle2,
  Copy,
  FileText,
  ListChecks,
  MessageCircle,
  Minus,
  Package,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Truck,
  Wrench,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import type {
  BrandRow,
  ProductCategoryRow,
  ProductImageRow,
  ProductRow,
  ProductSpecItem,
  ProductVehicleRow,
  SearchProductItem,
  ServiceRow,
} from '../../types/database';
import { getLocalized } from '../../i18n/helpers';
import { PageSEO } from '../../components/common/PageSEO';
import {
  JsonLd,
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
} from '../../components/common/JsonLd';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useSiteSettings } from '../settings/SiteSettingsContext';
import { useCart, MAX_CART_UNITS_PER_LINE } from '../cart/CartContext';
import { useVehicleFilter } from './VehicleFilterContext';
import { VehicleSelectorBar } from './VehicleSelectorBar';
import { CategoryIllustration } from './CategoryIllustration';
import { ProductCard, getPartOriginBadgeStyle } from './ProductCard';
import { computeDiscountPercent, formatPKRPrice } from './useCatalogueData';
import { buildWhatsAppUrl, cn } from '../../lib/utils';

interface EnrichedCompatibilityRow extends ProductVehicleRow {
  make_name: string;
  model_name: string | null;
}

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { settings } = useSiteSettings();
  const { selectedVehicle, makes, models } = useVehicleFilter();
  const { addItem, quote } = useCart();

  const lang = i18n.language;

  const [product, setProduct] = useState<ProductRow | null>(null);
  const [category, setCategory] = useState<ProductCategoryRow | null>(null);
  const [brand, setBrand] = useState<BrandRow | null>(null);
  const [images, setImages] = useState<ProductImageRow[]>([]);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [compatibilityRows, setCompatibilityRows] = useState<ProductVehicleRow[]>([]);
  const [linkedServices, setLinkedServices] = useState<ServiceRow[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<SearchProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'vehicles'>(
    'description'
  );
  const [showCarPicker, setShowCarPicker] = useState<boolean>(false);
  const [selectedQty, setSelectedQty] = useState<number>(1);

  useEffect(() => {
    if (!env.isConfigured || !slug) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);

      try {
        // Fetch product (without cost_price for public safety)
        const { data: prodData, error: prodErr } = await supabase
          .from('products')
          .select(
            'id, sku, slug, name, short_description, description, specs, category_id, brand_id, part_origin, price, compare_at_price, stock_qty, low_stock_threshold, is_universal, warranty, is_featured, is_active, is_demo, created_at, updated_at'
          )
          .eq('slug', slug)
          .maybeSingle();

        if (prodErr || !prodData) {
          if (!cancelled) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        const typedProd = {
          ...(prodData as any),
          price: Number(prodData.price),
          compare_at_price:
            prodData.compare_at_price !== null
              ? Number(prodData.compare_at_price)
              : null,
          cost_price: null,
          specs: Array.isArray(prodData.specs) ? prodData.specs : [],
        } as ProductRow;

        const [catRes, brandRes, imgRes, vehRes, srvLinkRes] = await Promise.all([
          typedProd.category_id
            ? supabase
                .from('product_categories')
                .select('*')
                .eq('id', typedProd.category_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          typedProd.brand_id
            ? supabase
                .from('brands')
                .select('*')
                .eq('id', typedProd.brand_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          supabase
            .from('product_images')
            .select('*')
            .eq('product_id', typedProd.id)
            .order('is_primary', { ascending: false })
            .order('sort_order', { ascending: true }),
          supabase
            .from('product_vehicles')
            .select('*')
            .eq('product_id', typedProd.id)
            .order('created_at', { ascending: true }),
          supabase
            .from('product_services')
            .select('service_id')
            .eq('product_id', typedProd.id),
        ]);

        // Fetch linked services details if any
        let servicesData: ServiceRow[] = [];
        const srvIds = (srvLinkRes.data ?? []).map(
          (r: { service_id: string }) => r.service_id
        );
        if (srvIds.length > 0) {
          const { data: sRows } = await supabase
            .from('services')
            .select('*')
            .in('id', srvIds)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
          servicesData = (sRows ?? []) as ServiceRow[];
        }

        // Fetch related products in same category
        let relatedItems: SearchProductItem[] = [];
        if (typedProd.category_id) {
          const { data: relRpc } = await supabase.rpc('search_products', {
            p_category_id: typedProd.category_id,
            p_page: 1,
            p_page_size: 5,
          });
          if (relRpc && Array.isArray(relRpc.items)) {
            relatedItems = relRpc.items
              .filter((i) => i.id !== typedProd.id)
              .slice(0, 4);
          }
        }

        if (!cancelled) {
          setProduct(typedProd);
          setCategory((catRes.data as ProductCategoryRow) ?? null);
          setBrand((brandRes.data as BrandRow) ?? null);
          const loadedImgs = (imgRes.data ?? []) as ProductImageRow[];
          setImages(loadedImgs);
          setActiveImageUrl(loadedImgs[0]?.url ?? null);
          setCompatibilityRows((vehRes.data ?? []) as ProductVehicleRow[]);
          setLinkedServices(servicesData);
          setRelatedProducts(relatedItems);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Enrich compatibility rows with make & model names
  const enrichedCompatibility: EnrichedCompatibilityRow[] = useMemo(() => {
    return compatibilityRows.map((row) => {
      const mk = makes.find((m) => m.id === row.make_id);
      const md = row.model_id ? models.find((m) => m.id === row.model_id) : null;
      return {
        ...row,
        make_name: mk?.name ?? 'Vehicle',
        model_name: md?.name ?? null,
      };
    });
  }, [compatibilityRows, makes, models]);

  // Evaluate compatibility against user's currently selected vehicle
  const compatibilityStatus = useMemo<
    'fits' | 'universal' | 'not_confirmed' | 'no_car_selected'
  >(() => {
    if (!product) return 'no_car_selected';
    if (!selectedVehicle) {
      return product.is_universal ? 'universal' : 'no_car_selected';
    }

    const matchesRow = compatibilityRows.some((row) => {
      if (row.make_id !== selectedVehicle.makeId) return false;
      if (
        selectedVehicle.modelId &&
        row.model_id &&
        row.model_id !== selectedVehicle.modelId
      ) {
        return false;
      }
      if (selectedVehicle.year) {
        if (row.year_from && selectedVehicle.year < row.year_from) return false;
        if (row.year_to && selectedVehicle.year > row.year_to) return false;
      }
      if (
        selectedVehicle.fuelType &&
        row.fuel_type &&
        row.fuel_type !== selectedVehicle.fuelType
      ) {
        return false;
      }
      return true;
    });

    if (matchesRow) return 'fits';
    if (product.is_universal) return 'universal';
    return 'not_confirmed';
  }, [product, selectedVehicle, compatibilityRows]);

  const handleCopySku = () => {
    if (!product) return;
    navigator.clipboard?.writeText(product.sku);
    toast.success(t('catalogue.productDetail.skuCopied', { sku: product.sku }));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <Skeleton className="h-5 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Skeleton className="aspect-square w-full rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-10 w-4/5" />
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          {t('catalogue.productDetail.notFoundTitle')}
        </h1>
        <p className="text-slate-600 mt-2">
          {t('catalogue.productDetail.notFoundDescription')}
        </p>
        <div className="mt-6">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{t('catalogue.backToShop')}</span>
          </Link>
        </div>
      </div>
    );
  }

  const productName = getLocalized(product.name, lang) || product.sku;
  const shortDesc = getLocalized(product.short_description, lang);
  const fullDesc = getLocalized(product.description, lang) || shortDesc;
  const discountPct = computeDiscountPercent(
    product.price,
    product.compare_at_price
  );

  const isOutOfStock = product.stock_qty <= 0;
  const isLowStock =
    product.stock_qty > 0 && product.stock_qty <= product.low_stock_threshold;

  const selectedCarLabel = selectedVehicle
    ? [selectedVehicle.makeName, selectedVehicle.modelName, selectedVehicle.year]
        .filter(Boolean)
        .join(' ')
    : '';

  // WhatsApp & Call CTAs
  const whatsappNumber =
    settings.whatsapp || settings.phone || '03126776844';
  const phoneNumber =
    settings.phone || settings.whatsapp || '03126776844';
  const pageUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://pakautoworks.pk/shop/product/${product.slug}`;

  const whatsappMessage = t('catalogue.productDetail.whatsappMessage', {
    name: getLocalized(product.name, 'en') || productName,
    sku: product.sku,
    price: formatPKRPrice(product.price),
    car: selectedCarLabel || t('catalogue.productDetail.myVehicle'),
    url: pageUrl,
  });
  const whatsappUrl = whatsappNumber
    ? buildWhatsAppUrl(whatsappNumber, whatsappMessage)
    : null;

  // SEO & JSON-LD
  const siteUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://pakautoworks.pk';
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: t('nav.home'), url: `${siteUrl}/` },
    { name: t('catalogue.title'), url: `${siteUrl}/shop` },
    ...(category
      ? [
          {
            name: getLocalized(category.name, lang),
            url: `${siteUrl}/shop/category/${category.slug}`,
          },
        ]
      : []),
    { name: productName, url: `${siteUrl}/shop/product/${product.slug}` },
  ]);

  const productJsonLd = buildProductJsonLd(
    product,
    brand,
    activeImageUrl,
    settings,
    lang
  );

  const specsList: ProductSpecItem[] = Array.isArray(product.specs)
    ? product.specs
    : [];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <PageSEO
        title={productName}
        description={shortDesc || fullDesc || productName}
        canonicalPath={`/shop/product/${product.slug}`}
        ogImage={activeImageUrl || undefined}
      />
      <JsonLd data={[breadcrumbJsonLd, productJsonLd]} />

      {/* Top Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-2">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs text-slate-500"
          >
            <Link to="/" className="hover:text-slate-900">
              {t('nav.home')}
            </Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-slate-900">
              {t('catalogue.title')}
            </Link>
            {category && (
              <>
                <span>/</span>
                <Link
                  to={`/shop/category/${category.slug}`}
                  className="hover:text-slate-900"
                >
                  {getLocalized(category.name, lang)}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-slate-900 font-semibold truncate max-w-[240px]">
              {productName}
            </span>
          </nav>

          <Link
            to={category ? `/shop/category/${category.slug}` : '/shop'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>{t('catalogue.backToShop')}</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        {/* Main Product Section: Left Gallery + Right Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column: Image Gallery (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-24">
            <div className="aspect-square w-full rounded-3xl bg-slate-900 border border-slate-200 overflow-hidden shadow-sm relative">
              {activeImageUrl ? (
                <img
                  src={activeImageUrl}
                  alt={productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <CategoryIllustration
                  slug={category?.slug}
                  iconName={category?.icon}
                  sku={product.sku}
                />
              )}

              {discountPct && (
                <span className="absolute top-4 end-4 px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-extrabold shadow-sm">
                  -{discountPct}% {t('catalogue.productDetail.off')}
                </span>
              )}
            </div>

            {/* Thumbnail Strip if multiple images */}
            {images.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {images.map((img) => {
                  const isCurrent = activeImageUrl === img.url;
                  return (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setActiveImageUrl(img.url)}
                      className={cn(
                        'w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all',
                        isCurrent
                          ? 'border-red-600 ring-2 ring-red-500/20'
                          : 'border-slate-200 opacity-75 hover:opacity-100'
                      )}
                    >
                      <img
                        src={img.url}
                        alt={img.alt || productName}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Product Info & CTAs (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              {/* Brand, Origin Badge & Copyable SKU */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {brand && (
                    <span className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold">
                      {brand.name}
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getPartOriginBadgeStyle(
                      product.part_origin
                    )}`}
                  >
                    {t(`catalogue.origins.${product.part_origin}`)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopySku}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-mono text-slate-700 transition-colors"
                  title={t('catalogue.productDetail.copySku')}
                >
                  <span>SKU: {product.sku}</span>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>

              {/* Product Name & Short Description */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                  {productName}
                </h1>
                {shortDesc && (
                  <p className="text-slate-600 text-sm sm:text-base mt-2.5 leading-relaxed">
                    {shortDesc}
                  </p>
                )}
              </div>

              {/* Price & Stock Status Row */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {t('catalogue.productDetail.priceLabel')}
                  </div>
                  <div className="flex items-baseline gap-3 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {formatPKRPrice(product.price)}
                    </span>
                    {product.compare_at_price &&
                      Number(product.compare_at_price) > Number(product.price) && (
                        <span className="text-sm sm:text-base text-slate-400 line-through font-medium">
                          {formatPKRPrice(product.compare_at_price)}
                        </span>
                      )}
                  </div>
                </div>

                {/* Stock Status & Warranty */}
                <div className="flex flex-col items-start sm:items-end gap-1.5">
                  {isOutOfStock ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      <span className="w-2 h-2 rounded-full bg-rose-600" />
                      {t('catalogue.stock.outOfStock')}
                    </span>
                  ) : isLowStock ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-600" />
                      {t('catalogue.stock.lowStockCount', {
                        count: product.stock_qty,
                      })}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      {t('catalogue.stock.inStockReady')}
                    </span>
                  )}

                  {product.warranty && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{product.warranty}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Compatibility Banner */}
              <div className="space-y-3">
                {compatibilityStatus === 'fits' && selectedVehicle && (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-bold text-emerald-950">
                          {t('catalogue.compatibility.confirmedFitTitle', {
                            car: selectedCarLabel,
                          })}
                        </h3>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          {t('catalogue.compatibility.confirmedFitSubtitle')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCarPicker((v) => !v)}
                      className="text-xs font-semibold text-emerald-800 underline shrink-0"
                    >
                      {t('catalogue.vehicleBar.changeCar')}
                    </button>
                  </div>
                )}

                {compatibilityStatus === 'universal' && (
                  <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-bold text-indigo-950">
                          {t('catalogue.compatibility.universalFit')}
                        </h3>
                        <p className="text-xs text-indigo-800 mt-0.5">
                          {t('catalogue.compatibility.universalSubtitle')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCarPicker((v) => !v)}
                      className="text-xs font-semibold text-indigo-800 underline shrink-0"
                    >
                      {selectedVehicle
                        ? t('catalogue.vehicleBar.changeCar')
                        : t('catalogue.compatibility.selectCarToCheck')}
                    </button>
                  </div>
                )}

                {compatibilityStatus === 'not_confirmed' && selectedVehicle && (
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-bold text-amber-950">
                          {t('catalogue.compatibility.notConfirmedTitle', {
                            car: selectedCarLabel,
                          })}
                        </h3>
                        <p className="text-xs text-amber-800 mt-0.5">
                          {t('catalogue.compatibility.notConfirmedSubtitle')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCarPicker((v) => !v)}
                      className="text-xs font-semibold text-amber-900 underline shrink-0"
                    >
                      {t('catalogue.vehicleBar.changeCar')}
                    </button>
                  </div>
                )}

                {compatibilityStatus === 'no_car_selected' && (
                  <div className="rounded-2xl bg-slate-100 border border-slate-200 p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Car className="w-5 h-5 text-slate-600 shrink-0" />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {t('catalogue.compatibility.checkYourVehicleTitle')}
                        </h3>
                        <p className="text-xs text-slate-600">
                          {t('catalogue.compatibility.checkYourVehicleSubtitle')}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCarPicker((v) => !v)}
                    >
                      {t('catalogue.compatibility.selectCarBtn')}
                    </Button>
                  </div>
                )}

                {showCarPicker && (
                  <VehicleSelectorBar compact className="mt-2" />
                )}
              </div>

              {/* Quantity & Add to Cart / Buy Now (COD) Controls */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                {!isOutOfStock && (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {t('cart.quantityLabel')}
                    </span>
                    <div className="inline-flex items-center rounded-xl bg-slate-100 border border-slate-200">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedQty((q) => Math.max(1, q - 1))
                        }
                        className="p-2.5 text-slate-700 hover:text-slate-900 cursor-pointer"
                        aria-label={t('cart.decreaseQty')}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span
                        dir="ltr"
                        className="px-4 text-sm font-extrabold text-slate-900 tabular-nums"
                      >
                        {selectedQty}
                      </span>
                      <button
                        type="button"
                        disabled={
                          selectedQty >=
                          Math.min(MAX_CART_UNITS_PER_LINE, product.stock_qty)
                        }
                        onClick={() =>
                          setSelectedQty((q) =>
                            Math.min(
                              MAX_CART_UNITS_PER_LINE,
                              product.stock_qty,
                              q + 1
                            )
                          )
                        }
                        className="p-2.5 text-slate-700 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
                        aria-label={t('cart.increaseQty')}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => {
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
                          primary_image_url: activeImageUrl,
                          part_origin: product.part_origin,
                          stock_qty: product.stock_qty,
                        },
                        selectedQty,
                        true
                      );
                    }}
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm sm:text-base font-bold bg-[#FF6A00] hover:bg-[#E05E00] disabled:bg-slate-200 disabled:text-slate-500 text-white shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-5 h-5 shrink-0" />
                    <span>
                      {isOutOfStock
                        ? t('catalogue.stock.outOfStock')
                        : t('cart.addToCartBtn')}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => {
                      const ok = addItem(
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
                          primary_image_url: activeImageUrl,
                          part_origin: product.part_origin,
                          stock_qty: product.stock_qty,
                        },
                        selectedQty,
                        false
                      );
                      if (ok) {
                        navigate('/checkout');
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm sm:text-base font-bold bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500 text-white shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ShoppingBag className="w-5 h-5 shrink-0" />
                    <span>{t('cart.buyNowCodBtn')}</span>
                  </button>
                </div>

                {/* Delivery rule strip on product detail */}
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-emerald-900">
                  <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {t('cart.deliveryRuleShort', {
                      freeCities: quote.free_cities.join(', '),
                      rate: formatPKRPrice(quote.flat_rate),
                    })}
                  </span>
                </div>
              </div>

              {/* Secondary CTAs: Order / Ask on WhatsApp + Call to Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-all"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span>{t('catalogue.productDetail.orderOnWhatsApp')}</span>
                  </a>
                )}

                {phoneNumber && (
                  <a
                    href={`tel:${phoneNumber.replace(/\s+/g, '')}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 transition-all"
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{t('catalogue.productDetail.callToOrder')}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Linked Workshop Installation Card ("Need this installed at our workshop?") */}
            {linkedServices.length > 0 && (
              <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 rounded-3xl p-6 text-white border border-slate-800 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold">
                        {t('catalogue.productDetail.installCardTitle')}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1">
                        {t('catalogue.productDetail.installCardSubtitle')}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {linkedServices.map((srv) => (
                          <Link
                            key={srv.id}
                            to={`/book?service=${encodeURIComponent(
                              srv.slug
                            )}&notes=${encodeURIComponent(
                              `Install ${product.sku} (${
                                getLocalized(product.name, 'en') || productName
                              })`
                            )}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-colors"
                          >
                            <span>
                              {t('catalogue.productDetail.bookServiceBtn', {
                                service: getLocalized(srv.name, lang),
                              })}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs Section: Description | Specifications | Compatible Vehicles */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="border-b border-slate-200 px-6 pt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('description')}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors',
                activeTab === 'description'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              )}
            >
              <FileText className="w-4 h-4" />
              <span>{t('catalogue.productDetail.tabs.description')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors',
                activeTab === 'specs'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              )}
            >
              <ListChecks className="w-4 h-4" />
              <span>
                {t('catalogue.productDetail.tabs.specifications')} (
                {specsList.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vehicles')}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors',
                activeTab === 'vehicles'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              )}
            >
              <Car className="w-4 h-4" />
              <span>
                {t('catalogue.productDetail.tabs.compatibleVehicles')} (
                {product.is_universal ? 'Universal' : enrichedCompatibility.length})
              </span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {activeTab === 'description' && (
              <div className="prose prose-slate max-w-3xl">
                <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                  {fullDesc || t('catalogue.productDetail.noDescription')}
                </p>
              </div>
            )}

            {activeTab === 'specs' && (
              <div>
                {specsList.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    {t('catalogue.productDetail.noSpecs')}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start border-collapse">
                      <tbody className="divide-y divide-slate-200">
                        {specsList.map((spec, index) => (
                          <tr
                            key={index}
                            className={index % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'}
                          >
                            <th className="py-3.5 px-4 font-semibold text-slate-700 w-1/3 text-start">
                              {getLocalized(spec.label, lang)}
                            </th>
                            <td className="py-3.5 px-4 text-slate-900 font-medium">
                              {getLocalized(spec.value, lang)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'vehicles' && (
              <div>
                {product.is_universal && enrichedCompatibility.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-50 text-indigo-900 border border-indigo-200">
                    <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
                    <p className="text-sm font-medium">
                      {t('catalogue.compatibility.universalSubtitle')}
                    </p>
                  </div>
                ) : enrichedCompatibility.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    {t('catalogue.productDetail.noVehicleRows')}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 bg-slate-50">
                          <th className="py-3 px-4 text-start">
                            {t('catalogue.vehicleBar.make')}
                          </th>
                          <th className="py-3 px-4 text-start">
                            {t('catalogue.vehicleBar.model')}
                          </th>
                          <th className="py-3 px-4 text-start">
                            {t('catalogue.productDetail.yearsColumn')}
                          </th>
                          <th className="py-3 px-4 text-start">
                            {t('catalogue.vehicleBar.fuelType')}
                          </th>
                          <th className="py-3 px-4 text-start">
                            {t('catalogue.productDetail.notesColumn')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {enrichedCompatibility.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {row.make_name}
                            </td>
                            <td className="py-3 px-4 text-slate-800">
                              {row.model_name || t('catalogue.vehicleBar.allModels')}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-slate-700">
                              {row.year_from && row.year_to
                                ? `${row.year_from} – ${row.year_to}`
                                : row.year_from
                                ? `${row.year_from}+`
                                : row.year_to
                                ? `Up to ${row.year_to}`
                                : t('catalogue.vehicleBar.anyYear')}
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              {row.fuel_type
                                ? t(`booking.fuelTypes.${row.fuel_type}`)
                                : t('catalogue.vehicleBar.anyFuel')}
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-xs">
                              {row.notes || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section aria-labelledby="related-products-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2
                id="related-products-heading"
                className="text-xl font-extrabold text-slate-900"
              >
                {t('catalogue.productDetail.relatedProducts')}
              </h2>
              {category && (
                <Link
                  to={`/shop/category/${category.slug}`}
                  className="text-sm font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                >
                  <span>{t('catalogue.viewAllInCategory')}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default ProductDetailPage;
