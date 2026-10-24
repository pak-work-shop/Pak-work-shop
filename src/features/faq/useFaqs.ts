import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import type { FaqCategory, FaqRow } from '../../types/database';

let cachedActiveFaqs: FaqRow[] | null = null;
let inflightFaqsPromise: Promise<FaqRow[]> | null = null;

export function invalidateFaqsCache(): void {
  cachedActiveFaqs = null;
  inflightFaqsPromise = null;
}

async function fetchActiveFaqsFromDb(): Promise<FaqRow[]> {
  if (!env.isConfigured) return [];
  if (cachedActiveFaqs) return cachedActiveFaqs;
  if (inflightFaqsPromise) return inflightFaqsPromise;

  inflightFaqsPromise = (async () => {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    inflightFaqsPromise = null;
    if (error) {
      throw new Error(error.message);
    }

    const list = (data ?? []) as FaqRow[];
    cachedActiveFaqs = list;
    return list;
  })();

  return inflightFaqsPromise;
}

export interface UseFaqsOptions {
  category?: FaqCategory | 'all';
  serviceId?: string | null;
  limit?: number;
}

export function useFaqs(options?: UseFaqsOptions) {
  const category = options?.category ?? 'all';
  const serviceId = options?.serviceId;
  const limit = options?.limit;

  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState<boolean>(env.isConfigured);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (force = false) => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }
    if (force) {
      invalidateFaqsCache();
    }
    setLoading(true);
    setError(null);

    try {
      const all = await fetchActiveFaqsFromDb();
      let filtered = all;

      if (serviceId !== undefined) {
        filtered = filtered.filter((f) => f.service_id === serviceId);
      }

      if (category !== 'all') {
        filtered = filtered.filter((f) => f.category === category);
      }

      if (limit) {
        filtered = filtered.slice(0, limit);
      }

      setFaqs(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  }, [category, serviceId, limit]);

  useEffect(() => {
    void reload(false);
  }, [reload]);

  return { faqs, loading, error, reload };
}
