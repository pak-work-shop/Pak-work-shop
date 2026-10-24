# PAYMENTS ARCHITECTURE & GATEWAY GUIDE — Pak Auto Works & Parts

> **UNVERIFIED SCAFFOLD - NOT IMPLEMENTED**: Real payment gateway integrations (JazzCash, Easypaisa, PayFast, Safepay) are unverified architectural scaffolds. They require merchant onboarding, valid merchant API credentials, and gateway documentation review before activation. The system never calls live payment endpoints with guessed parameters.

## 1. Overview
Pak Auto Works & Parts supports store order payments in two tiers:
1. **Manual Online Payment with Proof Verification** (Live & fully working today):
   - Supports Direct Bank Transfer (any Pakistani commercial bank / IBAN), JazzCash, and Easypaisa.
   - Customers view workshop account details, transfer the funds, and submit transaction ID + screenshot proof.
   - Workshop admin reviews submissions with a dedicated proof viewer via private Supabase Storage signed URLs, and verifies or rejects with clear feedback.
2. **Gateway-Ready Architecture & Demo Mock Gateway**:
   - In demo mode (`demo_mode = true`), a simulated hosted payment portal (`/pay/mock/:token`) lets developers and reviewers test the entire online payment flow (success / failure / idempotency) with zero merchant credentials.
   - Real gateways (JazzCash, Easypaisa, PayFast, Safepay) are scaffolded in Supabase Edge Functions with a unified adapter interface, isolated secrets, and a service-role database webhook handler (`public.apply_gateway_result`).

---

## 2. Gateway Environment Variables

To activate live Pakistani payment gateways in production, configure the following secrets via the Supabase CLI (`supabase secrets set`) or the Supabase Project Dashboard under **Project Settings → Edge Functions → Secrets**:

### JazzCash (HTTP Post Redirection & Webhook)
- `JAZZCASH_MERCHANT_ID`: Merchant ID issued by JazzCash / Mobilink Microfinance.
- `JAZZCASH_PASSWORD`: API Password for transaction hashing.
- `JAZZCASH_INTEGERITY_SALT`: Integrity Salt used for HMAC-SHA256 signature verification.
- `JAZZCASH_RETURN_URL`: Customer redirection return URL after hosted checkout.

### Easypaisa (Hosted Checkout & IPN)
- `EASYPAISA_STORE_ID`: Store ID assigned during Easypaisa merchant onboarding.
- `EASYPAISA_HASH_KEY`: Secret hash key for request/response checksum calculation.
- `EASYPAISA_POST_URL`: Easypaisa payment gateway API endpoint.

### PayFast (APPS - Pakistan)
- `PAYFAST_MERCHANT_ID`: PayFast Merchant ID.
- `PAYFAST_SECURED_KEY`: PayFast Secured Key for transaction authorization.

### Safepay (Checkout API)
- `SAFEPAY_API_KEY`: Safepay Sandbox or Production Public API Key.
- `SAFEPAY_SHARED_SECRET`: Webhook shared secret for signature verification (`X-SFPY-SIGNATURE`).
- `SAFEPAY_ENVIRONMENT`: Set to `sandbox` for testing or `production` for live transactions.

### System Secrets (Automatic in Supabase Functions)
- `SUPABASE_URL`: Supabase project URL (e.g., `https://xyz.supabase.co`).
- `SUPABASE_SERVICE_ROLE_KEY`: Secret service role key used to execute `public.apply_gateway_result`.

---

## 3. Webhook Flow & Architecture

```
[Customer Checkout] ──► [Initiate Payment] ──► [External Gateway / Mock Gateway]
                                                              │
                                                              ▼
[Customer Browser] ◄── [Redirect on Return] ◄──── [Gateway Response]
                                                              │
                                                       (HTTP POST IPN)
                                                              ▼
                                            [Edge Function: payment-webhook]
                                                              │
                                                     (Verify Signature)
                                                              ▼
                                            [RPC: apply_gateway_result]
                                             (SERVICE-ROLE ONLY, Idempotent)
                                                              │
                                            ┌─────────────────┴─────────────────┐
                                            ▼                                   ▼
                                    [Update payments]                   [Update orders]
                                   status = 'succeeded'               payment_status = 'paid'
                                                                     (placed -> confirmed)
```

### Webhook Endpoint URLs
- JazzCash Webhook: `https://<PROJECT_REF>.supabase.co/functions/v1/payment-webhook?provider=jazzcash`
- Easypaisa Webhook: `https://<PROJECT_REF>.supabase.co/functions/v1/payment-webhook?provider=easypaisa`
- PayFast Webhook: `https://<PROJECT_REF>.supabase.co/functions/v1/payment-webhook?provider=payfast`
- Safepay Webhook: `https://<PROJECT_REF>.supabase.co/functions/v1/payment-webhook?provider=safepay`

---

## 4. Edge Functions Deployment & Testing

### Deploying Functions via Supabase CLI
```bash
# Link project (if not already linked)
supabase link --project-ref <YOUR_PROJECT_REF>

# Set gateway secrets
supabase secrets set JAZZCASH_MERCHANT_ID="MC12345" JAZZCASH_PASSWORD="xyz" JAZZCASH_INTEGERITY_SALT="secret123"

# Deploy edge functions
supabase functions deploy payment-webhook --no-verify-jwt
supabase functions deploy create-payment
```

### Testing the Webhook with Sample Payload
```bash
# Sample test payload for JazzCash simulation
curl -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/payment-webhook?provider=jazzcash" \
  -H "Content-Type: application/json" \
  -d '{
    "pp_ResponseCode": "000",
    "pp_ResponseMessage": "Transaction Successful",
    "pp_BillReference": "ORD-000204",
    "pp_TxnRefNo": "T202610130001",
    "pp_Amount": "795000"
  }'
```
