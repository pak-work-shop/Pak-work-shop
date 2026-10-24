import type {
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentGatewayAdapter,
  WebhookVerificationResult,
} from './types.ts';

/**
 * JazzCash Payment Gateway Adapter Scaffold
 *
 * NOT IMPLEMENTED: requires merchant credentials and the gateway's current API documentation.
 * Required Environment Variables:
 *   - JAZZCASH_MERCHANT_ID
 *   - JAZZCASH_PASSWORD
 *   - JAZZCASH_INTEGERITY_SALT
 *   - JAZZCASH_RETURN_URL
 */
export class JazzCashAdapter implements PaymentGatewayAdapter {
  readonly providerName = 'jazzcash' as const;

  async createPayment(_params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const merchantId = Deno.env.get('JAZZCASH_MERCHANT_ID');
    const password = Deno.env.get('JAZZCASH_PASSWORD');
    const salt = Deno.env.get('JAZZCASH_INTEGERITY_SALT');

    if (!merchantId || !password || !salt) {
      throw new Error(
        'NOT IMPLEMENTED: JazzCash credentials missing. Configure JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, and JAZZCASH_INTEGERITY_SALT.'
      );
    }

    throw new Error(
      'NOT IMPLEMENTED: JazzCash HTTP Post redirection payload generation requires active merchant onboarding and API documentation.'
    );
  }

  async verifyWebhookSignature(_headers: Headers, _rawBody: string): Promise<boolean> {
    const salt = Deno.env.get('JAZZCASH_INTEGERITY_SALT');
    if (!salt) return false;
    // Stub HMAC-SHA256 signature calculation over sorted JazzCash parameters
    return false;
  }

  async parseWebhook(_headers: Headers, body: Record<string, unknown>): Promise<WebhookVerificationResult> {
    const responseCode = String(body['pp_ResponseCode'] ?? '');
    const orderNo = String(body['pp_BillReference'] ?? '');
    const txRef = String(body['pp_TxnRefNo'] ?? '');
    const amount = Number(body['pp_Amount'] ?? 0) / 100; // JazzCash amounts are formatted in paisas

    return {
      isValid: responseCode === '000',
      orderNo,
      providerReference: txRef,
      amount,
      status: responseCode === '000' ? 'succeeded' : 'failed',
      rawPayload: body,
      errorMessage: responseCode === '000' ? undefined : String(body['pp_ResponseMessage'] ?? 'Payment failed'),
    };
  }
}
