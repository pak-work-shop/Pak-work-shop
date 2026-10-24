import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import type {
  BrandRow,
  ProductCategoryRow,
  SearchProductItem,
} from '../../types/database';

import { isPhaseSchemaMissingError } from '../../lib/utils';

export interface CategoryWithCount extends ProductCategoryRow {
  product_count: number;
}

export interface BrandWithCount extends BrandRow {
  product_count: number;
}

export const isPhase5MissingError = isPhaseSchemaMissingError;

export function formatPKRPrice(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) {
    return 'PKR 0';
  }
  return `PKR ${Math.round(Number(amount)).toLocaleString('en-PK')}`;
}

export const formatProductPKR = formatPKRPrice;

export function computeDiscountPercent(
  price: number,
  compareAtPrice: number | null | undefined
): number | null {
  if (
    compareAtPrice === null ||
    compareAtPrice === undefined ||
    Number(compareAtPrice) <= Number(price) ||
    Number(compareAtPrice) <= 0
  ) {
    return null;
  }
  const pct = Math.round(
    ((Number(compareAtPrice) - Number(price)) / Number(compareAtPrice)) * 100
  );
  return pct > 0 ? pct : null;
}

export function calculateDiscountPercent(
  price: number,
  compareAtPrice: number | null | undefined
): number {
  return computeDiscountPercent(price, compareAtPrice) ?? 0;
}

/**
 * Loads active product categories and brands along with active product counts.
 */
export function useCatalogueTaxonomy() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [brands, setBrands] = useState<BrandWithCount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const [catRes, brandRes, prodRes] = await Promise.all([
        supabase
          .from('product_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('brands')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true }),
        supabase
          .from('products')
          .select('id, category_id, brand_id')
          .eq('is_active', true),
      ]);

      if (catRes.error) throw new Error(catRes.error.message);
      if (brandRes.error) throw new Error(brandRes.error.message);

      const rawCats = (catRes.data ?? []) as ProductCategoryRow[];
      const rawBrands = (brandRes.data ?? []) as BrandRow[];
      const activeProds = (prodRes.data ?? []) as Array<{
        id: string;
        category_id: string | null;
        brand_id: string | null;
      }>;

      // Count products per category (including child subcategories)
      const directCatCounts = new Map<string, number>();
      const brandCounts = new Map<string, number>();

      for (const p of activeProds) {
        if (p.category_id) {
          directCatCounts.set(
            p.category_id,
            (directCatCounts.get(p.category_id) ?? 0) + 1
          );
        }
        if (p.brand_id) {
          brandCounts.set(p.brand_id, (brandCounts.get(p.brand_id) ?? 0) + 1);
        }
      }

      const catsWithCounts: CategoryWithCount[] = rawCats.map((cat) => {
        let count = directCatCounts.get(cat.id) ?? 0;
        for (const child of rawCats) {
          if (child.parent_id === cat.id) {
            count += directCatCounts.get(child.id) ?? 0;
          }
        }
        return {
          ...cat,
          product_count: count,
        };
      });

      const brandsWithCounts: BrandWithCount[] = rawBrands.map((b) => ({
        ...b,
        product_count: brandCounts.get(b.id) ?? 0,
      }));

      setCategories(catsWithCounts);
      setBrands(brandsWithCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load catalogue taxonomy');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { categories, brands, loading, error, reload };
}

export function useProductCategories() {
  const { categories, loading, error, reload } = useCatalogueTaxonomy();
  return { categories, loading, error, reload };
}

/**
 * Fetches featured active products via search_products RPC (used on HomePage and ShopPage).
 */
export function useFeaturedProducts(limit = 6) {
  const [products, setProducts] = useState<SearchProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('search_products', {
        p_sort: 'featured',
        p_page: 1,
        p_page_size: limit,
      });

      if (!cancelled) {
        if (!error && data && Array.isArray(data.items)) {
          const featuredFirst = data.items.filter((i) => i.is_featured);
          setProducts(
            (featuredFirst.length > 0 ? featuredFirst : data.items).slice(0, limit)
          );
        }
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { products, loading };
}

/**
 * Fetches active products linked to a specific workshop service via product_services.
 */
export function useServiceLinkedProducts(serviceId: string | null | undefined) {
  const [products, setProducts] = useState<SearchProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!env.isConfigured || !serviceId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: linkRows, error: linkErr } = await supabase
          .from('product_services')
          .select('product_id')
          .eq('service_id', serviceId);

        if (linkErr || !linkRows || linkRows.length === 0) {
          if (!cancelled) setProducts([]);
          return;
        }

        const productIds = linkRows.map(
          (r: { product_id: string }) => r.product_id
        );

        const [prodsRes, imgsRes, brandsRes, catsRes] = await Promise.all([
          supabase
            .from('products')
            .select(
              'id, sku, slug, name, short_description, category_id, brand_id, part_origin, price, compare_at_price, stock_qty, low_stock_threshold, is_universal, warranty, is_featured, is_demo, created_at'
            )
            .in('id', productIds)
            .eq('is_active', true)
            .order('is_featured', { ascending: false }),
          supabase
            .from('product_images')
            .select('*')
            .in('product_id', productIds)
            .order('is_primary', { ascending: false })
            .order('sort_order', { ascending: true }),
          supabase.from('brands').select('id, name, slug, logo_url'),
          supabase.from('product_categories').select('id, slug, name, icon'),
        ]);

        if (prodsRes.error || !prodsRes.data) {
          if (!cancelled) setProducts([]);
          return;
        }

        const brandMap = new Map<
          string,
          { name: string; slug: string; logo_url: string | null }
        >();
        for (const b of (brandsRes.data ?? []) as Array<{
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
        }>) {
          brandMap.set(b.id, b);
        }

        const catMap = new Map<
          string,
          { slug: string; name: ProductCategoryRow['name']; icon: string | null }
        >();
        for (const c of (catsRes.data ?? []) as Array<{
          id: string;
          slug: string;
          name: ProductCategoryRow['name'];
          icon: string | null;
        }>) {
          catMap.set(c.id, c);
        }

        const primaryImgMap = new Map<string, { url: string; alt: string | null }>();
        for (const img of (imgsRes.data ?? []) as Array<{
          product_id: string;
          url: string;
          alt: string | null;
        }>) {
          if (!primaryImgMap.has(img.product_id)) {
            primaryImgMap.set(img.product_id, { url: img.url, alt: img.alt });
          }
        }

        const mapped: SearchProductItem[] = prodsRes.data.map((p: any) => {
          const b = p.brand_id ? brandMap.get(p.brand_id) : null;
          const c = p.category_id ? catMap.get(p.category_id) : null;
          const img = primaryImgMap.get(p.id);
          return {
            id: p.id,
            sku: p.sku,
            slug: p.slug,
            name: p.name,
            short_description: p.short_description,
            category_id: p.category_id,
            category_slug: c?.slug ?? null,
            category_name: c?.name ?? null,
            category_icon: c?.icon ?? null,
            brand_id: p.brand_id,
            brand_name: b?.name ?? null,
            brand_slug: b?.slug ?? null,
            brand_logo_url: b?.logo_url ?? null,
            part_origin: p.part_origin,
            price: Number(p.price),
            compare_at_price:
              p.compare_at_price !== null ? Number(p.compare_at_price) : null,
            stock_qty: p.stock_qty,
            low_stock_threshold: p.low_stock_threshold,
            is_universal: p.is_universal,
            warranty: p.warranty,
            is_featured: p.is_featured,
            is_demo: p.is_demo,
            primary_image_url: img?.url ?? null,
            primary_image_alt: img?.alt ?? null,
            matches_selected_vehicle: false,
            created_at: p.created_at,
          };
        });

        if (!cancelled) {
          setProducts(mapped);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  return { products, loading };
}
