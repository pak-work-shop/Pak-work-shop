import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  MessageCircle,
  Package,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import type { PartOrigin, SearchProductItem } from '../../types/database';
import { getLocalized } from '../../i18n/helpers';
import { PageSEO } from '../../components/common/PageSEO';
import { JsonLd, buildBreadcrumbJsonLd } from '../../components/common/JsonLd';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useSiteSettings } from '../settings/SiteSettingsContext';
import { useVehicleFilter } from './VehicleFilterContext';
import { VehicleSelectorBar } from './VehicleSelectorBar';
import { CategoryIcon } from './CategoryIllustration';
import { ProductCard } from './ProductCard';
import {
  useCatalogueTaxonomy,
  useFeaturedProducts,
} from './useCatalogueData';
import { buildWhatsAppUrl, cn } from '../../lib/utils';

const PART_ORIGIN_OPTIONS: PartOrigin[] = [
  'genuine_oem',
  'japanese_imported',
  'aftermarket',
  'local',
];

const PAGE_SIZE = 12;

export function ShopPage() {
  const { t, i18n } = useTranslation();
  const { slug: categorySlugParam } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const {
    selectedVehicle,
    setSelectedVehicle,
    updateIncludeUniversal,
    makes,
    models,
  } = useVehicleFilter();

  const lang = i18n.language;
  const {
    categories,
    brands,
    loading: taxonomyLoading,
  } = useCatalogueTaxonomy();
  const { products: featuredProducts } = useFeaturedProducts(6);

  // Sync URL ?make=...&model=...&year=... into VehicleFilterContext on mount if present
  const hydratedUrlVehicleRef = useRef(false);
  useEffect(() => {
    if (hydratedUrlVehicleRef.current || makes.length === 0) return;
    const urlMake = searchParams.get('make');
    if (urlMake) {
      const foundMake = makes.find(
        (m) => m.id === urlMake || m.slug === urlMake.toLowerCase()
      );
      if (foundMake) {
        const urlModel = searchParams.get('model');
        const foundModel = urlModel
          ? models.find(
              (md) =>
                md.make_id === foundMake.id &&
                (md.id === urlModel || md.slug === urlModel.toLowerCase())
            )
          : null;
        const urlYear = Number(searchParams.get('year'));
        setSelectedVehicle({
          makeId: foundMake.id,
          makeName: foundMake.name,
          modelId: foundModel?.id ?? null,
          modelName: foundModel?.name ?? null,
          year: Number.isFinite(urlYear) && urlYear >= 1970 ? urlYear : null,
          fuelType: null,
          includeUniversal: true,
        });
      }
      hydratedUrlVehicleRef.current = true;
    }
  }, [makes, models, searchParams, setSelectedVehicle]);

  // Resolve active category from route /shop/category/:slug or ?category=
  const activeCategory = useMemo(() => {
    const slugToFind = categorySlugParam || searchParams.get('category') || '';
    if (!slugToFind) return null;
    return (
      categories.find(
        (c) => c.slug.toLowerCase() === slugToFind.toLowerCase() || c.id === slugToFind
      ) ?? null
    );
  }, [categories, categorySlugParam, searchParams]);

  // Filter & Search States initialized from URL searchParams
  const [searchInput, setSearchInput] = useState<string>(
    () => searchParams.get('q') ?? ''
  );
  const [debouncedQuery, setDebouncedQuery] = useState<string>(
    () => searchParams.get('q') ?? ''
  );
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>(() => {
    const raw = searchParams.get('brands');
    return raw ? raw.split(',').filter(Boolean) : [];
  });
  const [selectedOrigins, setSelectedOrigins] = useState<PartOrigin[]>(() => {
    const raw = searchParams.get('origins');
    return raw
      ? (raw
          .split(',')
          .filter((o) =>
            PART_ORIGIN_OPTIONS.includes(o as PartOrigin)
          ) as PartOrigin[])
      : [];
  });
  const [priceMinInput, setPriceMinInput] = useState<string>(
    () => searchParams.get('min') ?? ''
  );
  const [priceMaxInput, setPriceMaxInput] = useState<string>(
    () => searchParams.get('max') ?? ''
  );
  const [inStockOnly, setInStockOnly] = useState<boolean>(
    () => searchParams.get('instock') === '1'
  );
  const [sortBy, setSortBy] = useState<string>(
    () => searchParams.get('sort') || 'featured'
  );
  const [page, setPage] = useState<number>(() => {
    const p = Number(searchParams.get('page'));
    return Number.isFinite(p) && p >= 1 ? p : 1;
  });

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);

  // Debounce search input by 250ms
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Sync filters to URL query params so pages are shareable
  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedQuery) next.set('q', debouncedQuery);
    if (!categorySlugParam && activeCategory) {
      next.set('category', activeCategory.slug);
    }
    if (selectedBrandIds.length > 0) {
      next.set('brands', selectedBrandIds.join(','));
    }
    if (selectedOrigins.length > 0) {
      next.set('origins', selectedOrigins.join(','));
    }
    if (priceMinInput.trim()) next.set('min', priceMinInput.trim());
    if (priceMaxInput.trim()) next.set('max', priceMaxInput.trim());
    if (inStockOnly) next.set('instock', '1');
    if (sortBy && sortBy !== 'featured') next.set('sort', sortBy);
    if (page > 1) next.set('page', String(page));

    setSearchParams(next, { replace: true });
  }, [
    debouncedQuery,
    categorySlugParam,
    activeCategory,
    selectedBrandIds,
    selectedOrigins,
    priceMinInput,
    priceMaxInput,
    inStockOnly,
    sortBy,
    page,
    setSearchParams,
  ]);

  // Products query state
  const [products, setProducts] = useState<SearchProductItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [queryError, setQueryError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!env.isConfigured) {
      setLoadingProducts(false);
      return;
    }

    // If route has a categorySlugParam but categories are still loading, wait
    if (categorySlugParam && taxonomyLoading) {
      return;
    }

    setLoadingProducts(true);
    setQueryError(null);

    try {
      const parsedMin = priceMinInput.trim() ? Number(priceMinInput) : null;
      const parsedMax = priceMaxInput.trim() ? Number(priceMaxInput) : null;

      const { data, error } = await supabase.rpc('search_products', {
        p_query: debouncedQuery || null,
        p_category_id: activeCategory?.id ?? null,
        p_brand_ids: selectedBrandIds.length > 0 ? selectedBrandIds : null,
        p_part_origins: selectedOrigins.length > 0 ? selectedOrigins : null,
        p_price_min:
          parsedMin !== null && Number.isFinite(parsedMin) && parsedMin >= 0
            ? parsedMin
            : null,
        p_price_max:
          parsedMax !== null && Number.isFinite(parsedMax) && parsedMax >= 0
            ? parsedMax
            : null,
        p_in_stock_only: inStockOnly,
        p_make_id: selectedVehicle?.makeId ?? null,
        p_model_id: selectedVehicle?.modelId ?? null,
        p_year: selectedVehicle?.year ?? null,
        p_fuel_type: selectedVehicle?.fuelType ?? null,
        p_include_universal: selectedVehicle?.includeUniversal ?? true,
        p_sort: sortBy,
        p_page: page,
        p_page_size: PAGE_SIZE,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        setProducts(Array.isArray(data.items) ? data.items : []);
        setTotalCount(typeof data.total_count === 'number' ? data.total_count : 0);
      } else {
        setProducts([]);
        setTotalCount(0);
      }
    } catch (err) {
      setQueryError(
        err instanceof Error ? err.message : t('common.unexpectedError')
      );
    } finally {
      setLoadingProducts(false);
    }
  }, [
    categorySlugParam,
    taxonomyLoading,
    debouncedQuery,
    activeCategory?.id,
    selectedBrandIds,
    selectedOrigins,
    priceMinInput,
    priceMaxInput,
    inStockOnly,
    selectedVehicle,
    sortBy,
    page,
    t,
  ]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const handleSelectCategory = (slug: string | null) => {
    setPage(1);
    if (!slug) {
      if (categorySlugParam) {
        navigate('/shop');
      } else {
        const next = new URLSearchParams(searchParams);
        next.delete('category');
        setSearchParams(next);
      }
    } else {
      navigate(`/shop/category/${slug}`);
    }
  };

  const toggleBrand = (brandId: string) => {
    setPage(1);
    setSelectedBrandIds((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId]
    );
  };

  const toggleOrigin = (origin: PartOrigin) => {
    setPage(1);
    setSelectedOrigins((prev) =>
      prev.includes(origin)
        ? prev.filter((o) => o !== origin)
        : [...prev, origin]
    );
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedQuery('');
    setSelectedBrandIds([]);
    setSelectedOrigins([]);
    setPriceMinInput('');
    setPriceMaxInput('');
    setInStockOnly(false);
    setSortBy('featured');
    setPage(1);
    if (categorySlugParam) {
      navigate('/shop');
    }
  };

  const hasActiveFilters = Boolean(
    debouncedQuery ||
      activeCategory ||
      selectedBrandIds.length > 0 ||
      selectedOrigins.length > 0 ||
      priceMinInput.trim() ||
      priceMaxInput.trim() ||
      inStockOnly
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Top-level categories for grid
  const topLevelCategories = useMemo(
    () => categories.filter((c) => !c.parent_id),
    [categories]
  );

  // Subcategories of activeCategory (if any)
  const subCategories = useMemo(() => {
    if (!activeCategory) return [];
    return categories.filter((c) => c.parent_id === activeCategory.id);
  }, [categories, activeCategory]);

  // WhatsApp general inquiry link for empty state
  const whatsappNumber =
    settings.whatsapp || settings.phone || '03126776844';
  const emptyStateWhatsAppUrl = whatsappNumber
    ? buildWhatsAppUrl(
        whatsappNumber,
        t('catalogue.whatsappGeneralPartRequest', {
          query: debouncedQuery || getLocalized(activeCategory?.name, 'en') || 'Auto Part',
          vehicle: selectedVehicle
            ? [selectedVehicle.makeName, selectedVehicle.modelName, selectedVehicle.year]
                .filter(Boolean)
                .join(' ')
            : 'My Car',
        })
      )
    : null;

  // SEO & Breadcrumbs
  const pageTitle = activeCategory
    ? `${getLocalized(activeCategory.name, lang)} — ${t('catalogue.seoTitle')}`
    : t('catalogue.seoTitle');
  const pageDescription = activeCategory
    ? getLocalized(activeCategory.description, lang) || t('catalogue.seoDescription')
    : t('catalogue.seoDescription');

  const siteUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://pakautoworks.pk';
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    activeCategory
      ? [
          { name: t('nav.home'), url: `${siteUrl}/` },
          { name: t('catalogue.title'), url: `${siteUrl}/shop` },
          {
            name: getLocalized(activeCategory.name, lang),
            url: `${siteUrl}/shop/category/${activeCategory.slug}`,
          },
        ]
      : [
          { name: t('nav.home'), url: `${siteUrl}/` },
          { name: t('catalogue.title'), url: `${siteUrl}/shop` },
        ]
  );

  // Filter Sidebar Content (shared between Desktop Sidebar and Mobile Drawer)
  const renderFilterControls = () => (
    <div className="space-y-6">
      {/* Category List */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          {t('catalogue.filters.categories')}
        </h3>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => handleSelectCategory(null)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors text-start',
              !activeCategory
                ? 'bg-red-50 text-red-700 font-semibold'
                : 'text-slate-700 hover:bg-slate-100'
            )}
          >
            <span>{t('catalogue.filters.allCategories')}</span>
          </button>

          {topLevelCategories.map((cat) => {
            const isSelected =
              activeCategory?.id === cat.id ||
              activeCategory?.parent_id === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.slug)}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm transition-colors text-start',
                  isSelected
                    ? 'bg-red-50 text-red-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                )}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <CategoryIcon
                    iconName={cat.icon}
                    slug={cat.slug}
                    className={cn(
                      'w-4 h-4',
                      isSelected ? 'text-red-600' : 'text-slate-400'
                    )}
                  />
                  <span className="truncate">{getLocalized(cat.name, lang)}</span>
                </span>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-md shrink-0',
                    isSelected
                      ? 'bg-red-100 text-red-700 font-semibold'
                      : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {cat.product_count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Availability Toggle */}
      <div className="pt-4 border-t border-slate-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          {t('catalogue.filters.availability')}
        </h3>
        <label className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
          <span className="text-sm font-medium text-slate-800">
            {t('catalogue.filters.inStockOnly')}
          </span>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => {
              setPage(1);
              setInStockOnly(e.target.checked);
            }}
            className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
          />
        </label>

        {selectedVehicle && (
          <label className="mt-2 flex items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 cursor-pointer">
            <span className="text-xs font-medium text-emerald-900">
              {t('catalogue.vehicleBar.includeUniversal')}
            </span>
            <input
              type="checkbox"
              checked={selectedVehicle.includeUniversal}
              onChange={(e) => {
                setPage(1);
                updateIncludeUniversal(e.target.checked);
              }}
              className="w-4 h-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
            />
          </label>
        )}
      </div>

      {/* Part Origin Checkboxes */}
      <div className="pt-4 border-t border-slate-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          {t('catalogue.filters.partOrigin')}
        </h3>
        <div className="space-y-2">
          {PART_ORIGIN_OPTIONS.map((origin) => {
            const checked = selectedOrigins.includes(origin);
            return (
              <label
                key={origin}
                className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleOrigin(origin)}
                  className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span>{t(`catalogue.origins.${origin}`)}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Brand Checkboxes */}
      {brands.length > 0 && (
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            {t('catalogue.filters.brands')}
          </h3>
          <div className="space-y-2 max-h-56 overflow-y-auto pe-1">
            {brands.map((brand) => {
              const checked = selectedBrandIds.includes(brand.id);
              return (
                <label
                  key={brand.id}
                  className="flex items-center justify-between gap-2 text-sm text-slate-700 cursor-pointer select-none"
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBrand(brand.id)}
                      className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="truncate">{brand.name}</span>
                  </span>
                  <span className="text-xs text-slate-400">
                    ({brand.product_count})
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Range (PKR) */}
      <div className="pt-4 border-t border-slate-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          {t('catalogue.filters.priceRangePkr')}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">
              {t('catalogue.filters.minPrice')}
            </label>
            <input
              type="number"
              min={0}
              step={100}
              placeholder="0"
              value={priceMinInput}
              onChange={(e) => {
                setPage(1);
                setPriceMinInput(e.target.value);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">
              {t('catalogue.filters.maxPrice')}
            </label>
            <input
              type="number"
              min={0}
              step={100}
              placeholder="50000"
              value={priceMaxInput}
              onChange={(e) => {
                setPage(1);
                setPriceMaxInput(e.target.value);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      {/* Clear All Button */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 me-1.5" />
            {t('catalogue.filters.resetAll')}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <PageSEO
        title={pageTitle}
        description={pageDescription}
        canonicalPath={
          activeCategory ? `/shop/category/${activeCategory.slug}` : '/shop'
        }
      />
      <JsonLd data={breadcrumbJsonLd} />

      {/* Hero / Page Header */}
      <section className="bg-slate-900 text-white pt-10 pb-12 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.16),transparent_60%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-4"
          >
            <Link to="/" className="hover:text-white transition-colors">
              {t('nav.home')}
            </Link>
            <span>/</span>
            {activeCategory ? (
              <>
                <Link to="/shop" className="hover:text-white transition-colors">
                  {t('catalogue.title')}
                </Link>
                <span>/</span>
                <span className="text-white font-medium">
                  {getLocalized(activeCategory.name, lang)}
                </span>
              </>
            ) : (
              <span className="text-white font-medium">
                {t('catalogue.title')}
              </span>
            )}
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold mb-3">
                <Package className="w-3.5 h-3.5" />
                <span>{t('catalogue.badge')}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {activeCategory
                  ? getLocalized(activeCategory.name, lang)
                  : t('catalogue.title')}
              </h1>
              <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
                {activeCategory
                  ? getLocalized(activeCategory.description, lang) ||
                    t('catalogue.subtitle')
                  : t('catalogue.subtitle')}
              </p>
            </div>

            {activeCategory && (
              <Link
                to="/shop"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-400 hover:text-amber-300 shrink-0"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{t('catalogue.backToAllCategories')}</span>
              </Link>
            )}
          </div>

          {/* Persistent "Shop for My Car" Vehicle Selector Bar */}
          <div className="mt-8">
            <VehicleSelectorBar />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-10">
        {/* Category Cards Grid (shown on /shop landing when no category route is active) */}
        {!activeCategory && topLevelCategories.length > 0 && (
          <section aria-labelledby="catalogue-categories-heading">
            <div className="flex items-center justify-between mb-4">
              <h2
                id="catalogue-categories-heading"
                className="text-lg sm:text-xl font-bold text-slate-900"
              >
                {t('catalogue.browseByCategory')}
              </h2>
              <span className="text-xs font-medium text-slate-500">
                {topLevelCategories.length} {t('catalogue.categoriesCountLabel')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {topLevelCategories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/shop/category/${cat.slug}`}
                  className="group bg-white hover:bg-slate-900 border border-slate-200/90 hover:border-slate-900 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-50 group-hover:bg-red-600 text-red-600 group-hover:text-white flex items-center justify-center transition-colors">
                    <CategoryIcon
                      iconName={cat.icon}
                      slug={cat.slug}
                      className="w-5 h-5"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-white line-clamp-2 leading-snug">
                      {getLocalized(cat.name, lang)}
                    </h3>
                    <p className="text-xs text-slate-500 group-hover:text-slate-300 mt-1">
                      {cat.product_count} {t('catalogue.itemsCount')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Subcategory pills when viewing a parent category that has children */}
        {activeCategory && subCategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 me-2">
              {t('catalogue.subcategories')}:
            </span>
            {subCategories.map((sub) => (
              <Link
                key={sub.id}
                to={`/shop/category/${sub.slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-red-500 text-xs font-semibold text-slate-800 shadow-2xs"
              >
                <span>{getLocalized(sub.name, lang)}</span>
                <span className="text-slate-400">({sub.product_count})</span>
              </Link>
            ))}
          </div>
        )}

        {/* Featured Parts Strip (shown on /shop default landing when no filters/search applied) */}
        {!hasActiveFilters &&
          !selectedVehicle &&
          page === 1 &&
          featuredProducts.length > 0 && (
            <section
              aria-labelledby="featured-parts-heading"
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-slate-800"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span>{t('catalogue.featuredStrip.badge')}</span>
                  </div>
                  <h2
                    id="featured-parts-heading"
                    className="text-xl sm:text-2xl font-extrabold"
                  >
                    {t('catalogue.featuredStrip.title')}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md">
                  {t('catalogue.featuredStrip.subtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {featuredProducts.slice(0, 3).map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
            </section>
          )}

        {/* Main Catalogue Workspace: Sidebar + Search/Sort Bar + Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs sticky top-24">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Filter className="w-4 h-4 text-red-600" />
                <span>{t('catalogue.filters.title')}</span>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  {t('catalogue.filters.clear')}
                </button>
              )}
            </div>
            {renderFilterControls()}
          </aside>

          {/* Right Column: Search, Sort, Active Chips & Product Grid */}
          <div className="lg:col-span-3 space-y-5">
            {/* Search + Sort + Mobile Filter Trigger Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Debounced Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t('catalogue.searchPlaceholder')}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 ps-10 pe-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    aria-label={t('common.clear')}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <select
                  aria-label={t('catalogue.sort.label')}
                  value={sortBy}
                  onChange={(e) => {
                    setPage(1);
                    setSortBy(e.target.value);
                  }}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 flex-1 sm:flex-initial"
                >
                  <option value="featured">{t('catalogue.sort.featured')}</option>
                  <option value="price_asc">{t('catalogue.sort.priceAsc')}</option>
                  <option value="price_desc">{t('catalogue.sort.priceDesc')}</option>
                  <option value="newest">{t('catalogue.sort.newest')}</option>
                  <option value="name_asc">{t('catalogue.sort.nameAsc')}</option>
                </select>

                {/* Mobile Filter Drawer Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden shrink-0"
                >
                  <SlidersHorizontal className="w-4 h-4 me-1.5" />
                  <span>{t('catalogue.filters.title')}</span>
                </Button>
              </div>
            </div>

            {/* Results Summary & Active Filter Chips */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <p className="text-sm text-slate-600">
                {loadingProducts ? (
                  <span>{t('common.loading')}</span>
                ) : (
                  <span>
                    {t('catalogue.showingResultsCount', {
                      count: totalCount,
                    })}
                  </span>
                )}
              </p>

              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {activeCategory && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                      {getLocalized(activeCategory.name, lang)}
                      <button
                        type="button"
                        onClick={() => handleSelectCategory(null)}
                        className="hover:text-red-900"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {inStockOnly && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {t('catalogue.filters.inStockOnly')}
                      <button
                        type="button"
                        onClick={() => setInStockOnly(false)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {selectedOrigins.map((o) => (
                    <span
                      key={o}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-200/80 text-slate-800"
                    >
                      {t(`catalogue.origins.${o}`)}
                      <button type="button" onClick={() => toggleOrigin(o)}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Error State */}
            {queryError && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-rose-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-sm">
                    {t('common.errorLoadingData')}
                  </h3>
                  <p className="text-xs text-rose-700 mt-1">{queryError}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void fetchProducts()}
                    className="mt-3"
                  >
                    {t('common.retry')}
                  </Button>
                </div>
              </div>
            )}

            {/* Loading Skeleton Grid */}
            {loadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden p-4 space-y-4"
                  >
                    <Skeleton className="aspect-square w-full rounded-xl" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-5 w-4/5" />
                    <Skeleton className="h-8 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              /* Friendly Empty State with Reset Filters & Ask on WhatsApp */
              <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-xl mx-auto my-6 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {t('catalogue.emptyState.title')}
                </h3>
                <p className="text-sm text-slate-600 mt-2">
                  {t('catalogue.emptyState.description')}
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {hasActiveFilters && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResetFilters}
                    >
                      <RotateCcw className="w-4 h-4 me-1.5" />
                      {t('catalogue.filters.resetAll')}
                    </Button>
                  )}

                  {emptyStateWhatsAppUrl && (
                    <a
                      href={emptyStateWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{t('catalogue.emptyState.askOnWhatsApp')}</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              /* Product Cards Grid */
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pt-6 flex items-center justify-between border-t border-slate-200">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => {
                        setPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 250, behavior: 'smooth' });
                      }}
                    >
                      <ChevronLeft className="w-4 h-4 me-1 rtl:rotate-180" />
                      {t('catalogue.pagination.previous')}
                    </Button>

                    <span className="text-xs sm:text-sm font-semibold text-slate-700">
                      {t('catalogue.pagination.pageOf', {
                        page,
                        total: totalPages,
                      })}
                    </span>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => {
                        setPage((p) => Math.min(totalPages, p + 1));
                        window.scrollTo({ top: 250, behavior: 'smooth' });
                      }}
                    >
                      {t('catalogue.pagination.next')}
                      <ChevronRight className="w-4 h-4 ms-1 rtl:rotate-180" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative ms-auto w-full max-w-xs bg-white h-full overflow-y-auto p-5 z-10 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <SlidersHorizontal className="w-4 h-4 text-red-600" />
                  <span>{t('catalogue.filters.title')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderFilterControls()}
            </div>

            <div className="pt-4 mt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="primary"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full"
              >
                {t('catalogue.filters.ApplyAndClose', { count: totalCount })}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShopPage;
