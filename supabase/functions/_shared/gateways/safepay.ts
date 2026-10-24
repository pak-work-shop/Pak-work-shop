import type {
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentGatewayAdapter,
  WebhookVerificationResult,
} from './types.ts';

/**
 * Safepay Payment Gateway Adapter Scaffold
 *
 * NOT IMPLEMENTED: requires merchant credentials and the gateway's current API documentation.
 * Required Environment Variables:
 *   - SAFEPAY_API_KEY
 *   - SAFEPAY_SHARED_SECRET
 *   - SAFEPAY_ENVIRONMENT (sandbox | production)
 */
export class SafepayAdapter implements PaymentGatewayAdapter {
  readonly providerName = 'safepay' as const;

  async createPayment(_params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const apiKey = Deno.env.get('SAFEPAY_API_KEY');
    if (!apiKey) {
      throw new Error('NOT IMPLEMENTED: Safepay API Key missing. Configure SAFEPAY_API_KEY.');
    }

    throw new Error('NOT IMPLEMENTED: Safepay checkout session initialization requires active sandbox/production credentials.');
  }

  async verifyWebhookSignature(_headers: Headers, _rawBody: string): Promise<boolean> {
    const secret = Deno.env.get('SAFEPAY_SHARED_SECRET');
    if (!secret) return false;
    // Safepay verifies via HMAC-SHA256 signature passed in X-SFPY-SIGNATURE
    return false;
  }

  async parseWebhook(_headers: Headers, body: Record<string, unknown>): Promise<WebhookVerificationResult> {
    const event = String(body['event'] ?? '');
    const data = (body['data'] as Record<string, unknown>) ?? {};
    const metadata = (data['metadata'] as Record<string, unknown>) ?? {};

    const orderNo = String(metadata['order_no'] ?? '');
    const token = String(data['token'] ?? '');
    const amount = Number(data['amount'] ?? 0);

    const isSuccess = event === 'payment.completed';

    return {
      isValid: isSuccess,
      orderNo,
      providerReference: token,
      amount,
      status: isSuccess ? 'succeeded' : 'failed',
      rawPayload: body,
      errorMessage: isSuccess ? undefined : 'Safepay payment not completed',
    };
  }
}
