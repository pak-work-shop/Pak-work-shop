import type {
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentGatewayAdapter,
  WebhookVerificationResult,
} from './types.ts';

/**
 * Easypaisa Payment Gateway Adapter Scaffold
 *
 * NOT IMPLEMENTED: requires merchant credentials and the gateway's current API documentation.
 * Required Environment Variables:
 *   - EASYPAISA_STORE_ID
 *   - EASYPAISA_HASH_KEY
 *   - EASYPAISA_POST_URL
 */
export class EasypaisaAdapter implements PaymentGatewayAdapter {
  readonly providerName = 'easypaisa' as const;

  async createPayment(_params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const storeId = Deno.env.get('EASYPAISA_STORE_ID');
    const hashKey = Deno.env.get('EASYPAISA_HASH_KEY');

    if (!storeId || !hashKey) {
      throw new Error(
        'NOT IMPLEMENTED: Easypaisa credentials missing. Configure EASYPAISA_STORE_ID and EASYPAISA_HASH_KEY.'
      );
    }

    throw new Error(
      'NOT IMPLEMENTED: Easypaisa Hosted Checkout / In-App redirect requires live merchant credentials and current API spec.'
    );
  }

  async verifyWebhookSignature(_headers: Headers, _rawBody: string): Promise<boolean> {
    const hashKey = Deno.env.get('EASYPAISA_HASH_KEY');
    if (!hashKey) return false;
    // Stub AES-128 / SHA256 checksum verification
    return false;
  }

  async parseWebhook(_headers: Headers, body: Record<string, unknown>): Promise<WebhookVerificationResult> {
    const responseCode = String(body['responseCode'] ?? body['desc'] ?? '');
    const orderNo = String(body['orderRefNum'] ?? '');
    const txRef = String(body['transactionId'] ?? '');
    const amount = Number(body['amount'] ?? 0);

    const isSuccess = responseCode === '0000' || responseCode === 'SUCCESS';

    return {
      isValid: isSuccess,
      orderNo,
      providerReference: txRef,
      amount,
      status: isSuccess ? 'succeeded' : 'failed',
      rawPayload: body,
      errorMessage: isSuccess ? undefined : String(body['message'] ?? 'Easypaisa transaction declined'),
    };
  }
}
