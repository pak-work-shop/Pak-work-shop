# AI Chatbot & Local Rule Engine Documentation

**Pak Auto Works & Parts — Vehicle-Aware Digital Assistant (Phase 9)**

---

## 1. Architecture Overview

The chatbot features a **dual-engine architecture** designed to guarantee zero downtime and immediate out-of-the-box operation:

```
                  ┌────────────────────────────────────────┐
                  │          Customer Chat Widget          │
                  │   (/src/features/chatbot/ChatWidget)   │
                  └───────────────────┬────────────────────┘
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
                  [Engine Mode: Auto]     [Engine Mode: Local Only]
                         │                         │
            ┌────────────┴────────────┐            │
            ▼                         ▼            │
    Supabase Edge Function       (Edge Error /     │
  (/supabase/functions/chat)     Missing Key)      │
            │                         │            │
      [Google Gemini]                 └─────┬──────┘
            │                               │
            │                               ▼
            │                   Local Deterministic Engine
            │               (/src/features/chatbot/localEngine.ts)
            │                               │
            └────────────────┬──────────────┘
                             ▼
                 PII-Masked Audit Logger
                  (RPC: public.chat_log)
```

1. **AI Engine (Google Gemini via Supabase Edge Function)**:
   - Invoked when `chatbot_settings.engine_mode = 'auto'`.
   - Runs server-side in `supabase/functions/chat/index.ts`.
   - Grounded in real Supabase database records (services, prices, FAQs, troubleshooting knowledge, delivery rules, and live catalog parts).
   - Generates structured JSON responses with validated navigation action chips (`book`, `products`, `track`, `whatsapp`, `call`).

2. **Local Deterministic Engine (`localEngine.ts`)**:
   - Zero-setup offline fallback.
   - Operates 100% in the browser with no external network dependencies or API keys.
   - Comprehensive pattern and keyword matching for greetings, workshop address, delivery fees, payment methods, job/order tracking, warning lights, maintenance basics, tyre care, brake issues, AC cooling, overheating, oil change, and parts inquiries.
   - Used automatically when `engine_mode = 'local_only'`, or if the Edge Function is undeployed or `GEMINI_API_KEY` is not configured.

---

## 2. Supabase Edge Function Deployment

### 2.1 Prerequisites
Install the Supabase CLI:
```bash
npm install -g supabase
```

Login and link to your Supabase project:
```bash
supabase login
supabase link --project-ref <your-supabase-project-id>
```

### 2.2 Configure Secrets
Set the required environment secrets:
```bash
# 1. Google Gemini API Key
supabase secrets set GEMINI_API_KEY="AIzaSy..."

# 2. Recommended Gemini Model (Default: gemini-3.8-flash)
# NOTE FOR WORKSHOP OWNER: Always verify the GEMINI_MODEL value against Google's current official model documentation (e.g. gemini-2.5-flash, gemini-1.5-flash) to ensure the model ID is active and available in your GCP project.
supabase secrets set GEMINI_MODEL="gemini-3.8-flash"

# 3. Allowed CORS Origins (Comma-separated or * for development)
supabase secrets set ALLOWED_ORIGINS="https://pakautoworks.com,https://ais-pre-cv7qbpwp3pty7zao7pv2yt-810677281236.asia-southeast1.run.app"
```

### 2.3 Deploy Function
Deploy the chat function:
```bash
supabase functions deploy chat
```

### 2.4 Verify Function Deployment
Test the deployed function using cURL:
```bash
curl -i --location --request POST 'https://<your-project-ref>.supabase.co/functions/v1/chat' \
  --header 'Content-Type: application/json' \
  --header 'apikey: <your-anon-key>' \
  --data '{
    "session_id": "90000000-0001-0000-0000-000000000001",
    "language": "en",
    "vehicle": {"make": "Toyota", "model": "Corolla", "year": 2021},
    "messages": [
      {"role": "user", "content": "My car brakes are squeaking"}
    ]
  }'
```

---

## 3. Grounding & Safety Guardrails

The Edge Function system prompt strictly enforces the following workshop safety rules:

1. **Strict Workshop Domain**: Only answers questions about cars, vehicle maintenance, Pak Auto Works services, spare parts, booking, delivery, payments, and tracking. Politeness steer back for off-topic queries.
2. **Zero Price/Stock Hallucination**: Uses only prices and policies present in the grounding context. Never invents quotes or discount promises.
3. **Mandatory Physical Inspection Disclaimer**: For any symptom or diagnostic query (noise, vibration, smoke, leak, overheating, check engine light), explicitly states that a hands-on physical inspection at the workshop is required for a final diagnosis.
4. **Safety-Critical Systems Protection**: Never provides dangerous DIY repair steps for brakes, airbags, fuel systems, or steering racks. Always advises professional inspection.
5. **Trilingual Support**:
   - English input &rarr; Clear English response.
   - Urdu script input &rarr; Natural, polite Urdu script response.
   - Roman Urdu input &rarr; Fluent Roman Urdu response.
6. **Action Links Whitelisting**:
   - `book`: Allowed only with valid active service slugs (e.g. `/book?service=brakes`).
   - `products`: Allowed only with catalogue routes (`/catalogue` or `/catalogue/product/:slug`).
   - `track`: Directs to `/track`.
   - `whatsapp` & `call`: Workshop phone `0312-6776844`.

---

## 4. Privacy & PII Scrubbing

The database RPC `public.chat_log` protects customer privacy:
- **Digit Scrubbing**: Any sequence of 7 or more consecutive digits (phone numbers, CNIC, card numbers, order references) is automatically replaced with `***MASKED***` before insertion.
- **Vehicle Sanitization**: Only stores `{ "make", "model", "year" }` to prevent license plates or chassis numbers from persisting in chat logs.
- **Admin Access Only**: RLS allows only administrative users (`public.is_admin() = true`) to read `chat_sessions` and `chat_messages`.
