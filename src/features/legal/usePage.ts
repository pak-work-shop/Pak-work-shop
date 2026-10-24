import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import type { LegalPageSlug, PageRow } from '../../types/database';

const cachedPagesBySlug = new Map<LegalPageSlug, PageRow | null>();

export function invalidatePagesCache(): void {
  cachedPagesBySlug.clear();
}

export function usePage(slug: LegalPageSlug) {
  const [page, setPage] = useState<PageRow | null>(
    () => cachedPagesBySlug.get(slug) ?? null
  );
  const [loading, setLoading] = useState<boolean>(
    env.isConfigured && !cachedPagesBySlug.has(slug)
  );
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (queryError) {
        throw new Error(queryError.message);
      }

      const row = (data as PageRow | null) ?? null;
      cachedPagesBySlug.set(slug, row);
      setPage(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load page');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { page, loading, error, reload };
}
