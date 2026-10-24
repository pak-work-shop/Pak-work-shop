/**
 * Supabase Edge Function: payment-webhook
 * Authoritative gateway webhook handler.
 * Verifies signature, invokes service-role RPC public.apply_gateway_result,
 * and responds idempotently.
 */

import { JazzCashAdapter } from '../_shared/gateways/jazzcash.ts';
import { EasypaisaAdapter } from '../_shared/gateways/easypaisa.ts';
import { PayFastAdapter } from '../_shared/gateways/payfast.ts';
import { SafepayAdapter } from '../_shared/gateways/safepay.ts';
import type { PaymentGatewayAdapter } from '../_shared/gateways/types.ts';

const adapters: Record<string, PaymentGatewayAdapter> = {
  jazzcash: new JazzCashAdapter(),
  easypaisa: new EasypaisaAdapter(),
  payfast: new PayFastAdapter(),
  safepay: new SafepayAdapter(),
};

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const provider = url.searchParams.get('provider')?.toLowerCase() || 'other';
  const adapter = adapters[provider];

  if (!adapter) {
    return new Response(JSON.stringify({ error: `Unsupported gateway provider: ${provider}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const rawBody = await req.text();
    let bodyJson: Record<string, unknown> = {};

    try {
      bodyJson = JSON.parse(rawBody);
    } catch {
      // Some gateways send form-url-encoded bodies
      const params = new URLSearchParams(rawBody);
      params.forEach((value, key) => {
        bodyJson[key] = value;
      });
    }

    // Parse and verify signature
    const parsed = await adapter.parseWebhook(req.headers, bodyJson);

    if (!parsed.orderNo || !parsed.providerReference) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload: missing orderNo or providerReference' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call service-role RPC public.apply_gateway_result via Supabase REST
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/apply_gateway_result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        p_provider: provider,
        p_provider_reference: parsed.providerReference,
        p_order_no: parsed.orderNo,
        p_amount: parsed.amount ?? null,
        p_status: parsed.status,
        p_raw: parsed.rawPayload,
      }),
    });

    if (!rpcRes.ok) {
      const errText = await rpcRes.text();
      console.error(`apply_gateway_result RPC error (${rpcRes.status}):`, errText);
      return new Response(JSON.stringify({ error: 'Failed to process payment result', details: errText }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await rpcRes.json();
    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return new Response(
      JSON.stringify({ error: 'Webhook processing error', message: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
