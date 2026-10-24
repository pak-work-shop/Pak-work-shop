import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Search, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { normalizePakPhoneInput, PAK_MOBILE_REGEX } from '../../lib/validators';

export function ChatInlineTracker() {
  const { t } = useTranslation();
  const [reference, setReference] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    type: 'job' | 'order' | 'booking';
    ref: string;
    status: string;
    details: string;
  } | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRef = reference.trim().toUpperCase();
    const cleanPhone = normalizePakPhoneInput(phone);

    if (!cleanRef) {
      setError(t('track.jobLookup.errors.emptyRef', 'Please enter your Reference / Job / Order #'));
      return;
    }
    if (!cleanPhone || !PAK_MOBILE_REGEX.test(cleanPhone)) {
      setError(t('track.jobLookup.errors.invalidPhone', 'Please enter a valid 11-digit mobile number'));
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (cleanRef.startsWith('JC')) {
        const { data, error: rpcErr } = await supabase.rpc('lookup_job_status', {
          p_job_no: cleanRef,
          p_phone: cleanPhone,
        });
        if (rpcErr || !data || !(data as any).found) {
          setError(t('track.jobLookup.errors.notFound', 'No matching active job found. Check reference and phone.'));
        } else {
          const job = data as any;
          setResult({
            type: 'job',
            ref: job.job_no || cleanRef,
            status: job.current_status || 'In Progress',
            details: `${job.vehicle_summary || 'Vehicle'} • ${job.stage_description || 'Active repair at workshop'}`,
          });
        }
      } else if (cleanRef.startsWith('ORD')) {
        const { data, error: rpcErr } = await supabase.rpc('lookup_order_status', {
          p_order_no: cleanRef,
          p_phone: cleanPhone,
        });
        if (rpcErr || !data || !(data as any).found) {
          setError(t('track.orderLookup.errors.notFound', 'No matching order found. Check order # and phone.'));
        } else {
          const ord = data as any;
          setResult({
            type: 'order',
            ref: ord.order_no || cleanRef,
            status: ord.status || 'Processing',
            details: `${ord.city || 'Pakistan'} • ${ord.courier_name ? `${ord.courier_name} (${ord.tracking_number || ''})` : 'Preparing dispatch'}`,
          });
        }
      } else {
        // Try job first, then order
        const { data: jData } = await supabase.rpc('lookup_job_status', {
          p_job_no: cleanRef,
          p_phone: cleanPhone,
        });
        if (jData && (jData as any).found) {
          const job = jData as any;
          setResult({
            type: 'job',
            ref: job.job_no || cleanRef,
            status: job.current_status || 'In Progress',
            details: `${job.vehicle_summary || 'Vehicle'} • ${job.stage_description || 'Active repair at workshop'}`,
          });
        } else {
          const { data: oData } = await supabase.rpc('lookup_order_status', {
            p_order_no: cleanRef,
            p_phone: cleanPhone,
          });
          if (oData && (oData as any).found) {
            const ord = oData as any;
            setResult({
              type: 'order',
              ref: ord.order_no || cleanRef,
              status: ord.status || 'Processing',
              details: `${ord.city || 'Pakistan'} • ${ord.courier_name ? `${ord.courier_name} (${ord.tracking_number || ''})` : 'Preparing dispatch'}`,
            });
          } else {
            setError(t('track.jobLookup.errors.notFound', 'No record found. Check reference and registered phone.'));
          }
        }
      }
    } catch (_err) {
      setError(t('common.error', 'Lookup failed. Please visit the full tracking page.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 rounded-xl bg-[#161920] border border-[#2A2E39] p-3 text-xs space-y-2.5">
      <div className="font-semibold text-gray-200 flex items-center justify-between">
        <span>{t('chatbot.quickTrackTitle', 'Quick Status Lookup')}</span>
        <Link
          to="/track"
          className="text-[11px] text-[#FF6A00] hover:underline flex items-center gap-0.5"
        >
          {t('chatbot.openFullTracker', 'Full Tracker')}
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <form onSubmit={handleTrack} className="space-y-2">
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Ref # (e.g. JC-000001, ORD-000201)"
          className="w-full rounded-lg bg-[#20252F] border border-[#333947] px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:border-[#FF6A00] focus:outline-none"
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone (03xxxxxxxxx)"
          className="w-full rounded-lg bg-[#20252F] border border-[#333947] px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:border-[#FF6A00] focus:outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#FF6A00] py-1.5 text-xs font-semibold text-white hover:bg-[#E05600] disabled:opacity-50 transition"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
          {t('track.searchButton', 'Lookup Status')}
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-1.5 text-[11px] text-red-400 bg-red-950/30 p-2 rounded-md border border-red-900/40">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="rounded-lg bg-emerald-950/30 border border-emerald-800/40 p-2.5 text-[11px] text-emerald-200 space-y-1">
          <div className="flex items-center justify-between font-bold text-white">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              {result.ref}
            </span>
            <span className="rounded bg-emerald-600/30 px-1.5 py-0.5 text-[10px] text-emerald-300 uppercase font-black">
              {result.status}
            </span>
          </div>
          <p className="text-gray-300">{result.details}</p>
        </div>
      )}
    </div>
  );
}
