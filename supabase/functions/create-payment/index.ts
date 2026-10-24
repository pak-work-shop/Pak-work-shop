/**
 * Supabase Edge Function: create-payment
 * Initiates an external hosted checkout session for JazzCash, Easypaisa, PayFast, or Safepay.
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

  try {
    const payload = await req.json();
    const provider = String(payload.provider || '').toLowerCase();
    const adapter = adapters[provider];

    if (!adapter) {
      return new Response(JSON.stringify({ error: `Provider ${provider} is not supported` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const session = await adapter.createPayment({
      orderNo: payload.orderNo,
      amount: Number(payload.amount),
      currency: 'PKR',
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      customerEmail: payload.customerEmail,
      returnUrl: payload.returnUrl,
      webhookUrl: payload.webhookUrl,
    });

    return new Response(JSON.stringify({ success: true, session }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isNotImplemented = msg.includes('NOT IMPLEMENTED');
    return new Response(
      JSON.stringify({
        error: isNotImplemented ? 'Gateway not configured' : 'Payment creation error',
        message: msg,
      }),
      {
        status: isNotImplemented ? 501 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
