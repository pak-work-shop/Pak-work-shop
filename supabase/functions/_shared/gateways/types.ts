/**
 * Pak Auto Works & Parts — Gateway Provider Interface & Types
 * Shared definitions for payment gateway adapters.
 */

// Ambient Deno runtime typing for edge functions
declare global {
  // eslint-disable-next-line no-var
  var Deno: {
    env: {
      get(key: string): string | undefined;
    };
    serve(handler: (req: Request) => Promise<Response> | Response): void;
  };
}

export type GatewayProviderName = 'jazzcash' | 'easypaisa' | 'payfast' | 'safepay' | 'mock';

export interface CreatePaymentParams {
  orderNo: string;
  amount: number;
  currency: 'PKR';
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  returnUrl: string;
  webhookUrl: string;
}

export interface CreatePaymentResult {
  provider: GatewayProviderName;
  redirectUrl?: string;
  formAction?: string;
  formFields?: Record<string, string>;
  paymentId: string;
  transactionRef: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  orderNo?: string;
  providerReference?: string;
  amount?: number;
  status: 'succeeded' | 'failed';
  rawPayload: Record<string, unknown>;
  errorMessage?: string;
}

export interface PaymentGatewayAdapter {
  readonly providerName: GatewayProviderName;
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  verifyWebhookSignature(headers: Headers, rawBody: string): Promise<boolean>;
  parseWebhook(headers: Headers, body: Record<string, unknown>): Promise<WebhookVerificationResult>;
}
