import { useCallback, useEffect, useState } from 'react';
import type { TFunction } from 'i18next';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import {
  resolveDirectImageUrl,
  SECTION_A_SERVICE_IMAGES,
} from '../../lib/defaultImages';
import type { ServiceRow } from '../../types/database';

let cachedActiveServices: ServiceRow[] | null = null;
let inflightActivePromise: Promise<ServiceRow[]> | null = null;

export function normalizeServiceRow(service: ServiceRow): ServiceRow {
  const resolved =
    resolveDirectImageUrl(service.image_url) ||
    SECTION_A_SERVICE_IMAGES[service.slug] ||
    '';
  return {
    ...service,
    image_url: resolved,
  };
}

export function invalidateServicesCache(): void {
  cachedActiveServices = null;
  inflightActivePromise = null;
}

export function formatPkrAmount(value: number): string {
  return Math.round(value).toLocaleString('en-PK');
}

/**
 * Formats the service price label according to Section 4.2:
 * - Both price_from and price_to set -> "Rs. X – Rs. Y"
 * - Only price_from set -> "Starting from Rs. X"
 * - Neither set -> "Contact us for a quote"
 */
export function formatServicePriceLabel(service: ServiceRow, t: TFunction): string {
  const hasFrom = service.price_from !== null && service.price_from !== undefined;
  const hasTo = service.price_to !== null && service.price_to !== undefined;

  if (hasFrom && hasTo) {
    return t('services.priceRange', {
      from: formatPkrAmount(Number(service.price_from)),
      to: formatPkrAmount(Number(service.price_to)),
    });
  }

  if (hasFrom) {
    return t('services.priceStartingFrom', {
      from: formatPkrAmount(Number(service.price_from)),
    });
  }

  return t('services.priceQuote');
}

async function fetchActiveServicesFromDb(): Promise<ServiceRow[]> {
  if (!env.isConfigured) return [];
  if (cachedActiveServices) return cachedActiveServices;
  if (inflightActivePromise) return inflightActivePromise;

  inflightActivePromise = (async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    inflightActivePromise = null;
    if (error) {
      throw new Error(error.message);
    }

    const list = ((data ?? []) as ServiceRow[]).map(normalizeServiceRow);
    cachedActiveServices = list;
    return list;
  })();

  return inflightActivePromise;
}

export interface UseServicesOptions {
  featuredOnly?: boolean;
  limit?: number;
}

export function useServices(options?: UseServicesOptions) {
  const featuredOnly = options?.featuredOnly ?? false;
  const limit = options?.limit;

  const [services, setServices] = useState<ServiceRow[]>(() => {
    if (!cachedActiveServices) return [];
    let list = cachedActiveServices;
    if (featuredOnly) {
      list = list.filter((s) => s.is_featured);
    }
    return limit ? list.slice(0, limit) : list;
  });
  const [loading, setLoading] = useState<boolean>(
    env.isConfigured && !cachedActiveServices
  );
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (force = false) => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }
    if (force) {
      invalidateServicesCache();
    }
    setLoading(true);
    setError(null);
    try {
      const all = await fetchActiveServicesFromDb();
      let filtered = featuredOnly ? all.filter((s) => s.is_featured) : all;
      if (limit) {
        filtered = filtered.slice(0, limit);
      }
      setServices(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, [featuredOnly, limit]);

  useEffect(() => {
    void reload(false);
  }, [reload]);

  return { services, loading, error, reload };
}

export function useService(slug: string | undefined) {
  const [service, setService] = useState<ServiceRow | null>(() => {
    if (!slug || !cachedActiveServices) return null;
    return cachedActiveServices.find((s) => s.slug === slug && s.is_active) ?? null;
  });
  const [relatedServices, setRelatedServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(slug) && env.isConfigured);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!slug || !env.isConfigured) {
      setService(null);
      setRelatedServices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allActive = await fetchActiveServicesFromDb();
      const found = allActive.find((s) => s.slug === slug && s.is_active) ?? null;
      setService(found);

      if (found) {
        const others = allActive
          .filter((s) => s.id !== found.id && s.is_active)
          .slice(0, 3);
        setRelatedServices(others);
      } else {
        setRelatedServices([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load service');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { service, relatedServices, loading, error, reload };
}
