import type {
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentGatewayAdapter,
  WebhookVerificationResult,
} from './types.ts';

/**
 * PayFast (APPS - Pakistan) Payment Gateway Adapter Scaffold
 *
 * NOT IMPLEMENTED: requires merchant credentials and the gateway's current API documentation.
 * Required Environment Variables:
 *   - PAYFAST_MERCHANT_ID
 *   - PAYFAST_SECURED_KEY
 */
export class PayFastAdapter implements PaymentGatewayAdapter {
  readonly providerName = 'payfast' as const;

  async createPayment(_params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const merchantId = Deno.env.get('PAYFAST_MERCHANT_ID');
    const securedKey = Deno.env.get('PAYFAST_SECURED_KEY');

    if (!merchantId || !securedKey) {
      throw new Error(
        'NOT IMPLEMENTED: PayFast credentials missing. Configure PAYFAST_MERCHANT_ID and PAYFAST_SECURED_KEY.'
      );
    }

    throw new Error('NOT IMPLEMENTED: PayFast token request and checkout redirect require active merchant configuration.');
  }

  async verifyWebhookSignature(_headers: Headers, _rawBody: string): Promise<boolean> {
    return false;
  }

  async parseWebhook(_headers: Headers, body: Record<string, unknown>): Promise<WebhookVerificationResult> {
    const status = String(body['status_code'] ?? body['transaction_status'] ?? '');
    const orderNo = String(body['basket_id'] ?? '');
    const txRef = String(body['transaction_id'] ?? '');
    const amount = Number(body['transaction_amount'] ?? 0);

    const isSuccess = status === '00' || status === 'SUCCESS';

    return {
      isValid: isSuccess,
      orderNo,
      providerReference: txRef,
      amount,
      status: isSuccess ? 'succeeded' : 'failed',
      rawPayload: body,
      errorMessage: isSuccess ? undefined : String(body['err_msg'] ?? 'PayFast payment failed'),
    };
  }
}
