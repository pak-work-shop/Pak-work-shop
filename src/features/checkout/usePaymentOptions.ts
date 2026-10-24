import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import type { PaymentOptionsAccount, PaymentOptionsResponse } from '../../types/database';

export function usePaymentOptions() {
  const [options, setOptions] = useState<PaymentOptionsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Attempt to invoke get_payment_options RPC
      const { data, error: rpcErr } = await supabase.rpc('get_payment_options');

      if (rpcErr) {
        // Fallback: direct table select if RPC isn't deployed yet
        const [accRes, setRes, siteRes] = await Promise.all([
          supabase
            .from('payment_accounts')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
          supabase.from('payment_settings').select('*').eq('id', 1).maybeSingle(),
          supabase.from('site_settings').select('demo_mode').eq('id', 1).maybeSingle(),
        ]);

        const isDemo = Boolean(siteRes.data?.demo_mode);
        const ps = setRes.data;
        const accounts = (accRes.data as unknown as PaymentOptionsAccount[]) || [];

        setOptions({
          online_enabled: Boolean(ps?.manual_enabled) || Boolean(ps?.mock_gateway_enabled && isDemo),
          manual_enabled: ps?.manual_enabled ?? true,
          mock_gateway_enabled: Boolean(ps?.mock_gateway_enabled && isDemo),
          gateway_provider: ps?.gateway_provider ?? null,
          require_proof: ps?.require_proof ?? true,
          is_demo_mode: isDemo,
          accounts,
        });
      } else if (data) {
        setOptions(data as unknown as PaymentOptionsResponse);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment options');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOptions();
  }, [fetchOptions]);

  return {
    options,
    loading,
    error,
    refresh: fetchOptions,
  };
}
