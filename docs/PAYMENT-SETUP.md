# ITIN PRO sandbox payment setup

Update, 12 October 2026: the enquiry database connection and staff email sending are working. The replacement Stripe key passed the read-only catalog check. The user explicitly approved sandbox testing, and the three flows below completed without real funds or a real service booking.

| Sandbox flow | Amount | Stripe and database result |
|---|---:|---|
| LLC owner with US bank account, synthetic LLC/EIN confirmation | £425 GBP | Checkout complete/paid; Supabase paid |
| EIN application | £375 GBP | Checkout complete/paid; Supabase paid |
| Custom travel (£75) and courier (£15) invoice | £90 GBP | Invoice paid with no VAT; Supabase paid |

Enquiries returned HTTP 201 and distinct Resend email IDs. Inbox delivery remains unverified. Both checkout creation retries returned the same sessions; a repeat checkout request after payment returned HTTP 409. Reapplying each actual payment event to the database reconciliation function returned `duplicate` in a rolled-back transaction. This tested database de-duplication, rather than a second HTTP delivery from Stripe. Three genuine signed Stripe webhooks independently marked the matching orders paid.

New Checkout Sessions explicitly disable Adaptive Pricing to retain the quoted GBP fees. The invoice route now reuses its persisted customer and invoice IDs on later retries. Unfinished requests older than 23 hours require review, avoiding reliance on expired Stripe idempotency keys. Twelve automated tests, TypeScript checks and a production build passed.

These are sandbox results, not live-payment approval. After final verification the public test-payment button is turned off (`PAYMENTS_ENABLED=false`). The recurring integration checks remain paused. Remaining work: confirm staff inbox delivery and build the secure client document portal before collecting taxpayer identifiers or documents. Live payments require separate configuration, launch checks and approval.

## 1. Correct the database connection

Open the ITIN PRO project in the Supabase Dashboard and copy its Project URL from the Connect dialog / Data API settings. Use the base HTTPS URL, normally `https://<project-reference>.supabase.co`. Do not use the Supabase dashboard address, a PostgreSQL connection string, a key, or the placeholder text.

Render service: https://dashboard.render.com/web/srv-db5slrnavr4c739ugdag

Set `SUPABASE_URL` to that exact URL. `SUPABASE_SERVICE_ROLE_KEY` must contain this same project's server-side service-role or secret key, never its anon/publishable key. Store credentials in Render environment settings, not GitHub or chat.

Run the existing `supabase.sql` if the `enquiries` table has not been created. Then run `supabase-payments.sql` in the same project's SQL Editor. The payment migration is additive, with no public access policies, and is tested against PostgreSQL.

These tables are already created on the connected ITIN PRO project. No manual SQL setup is required there. The existing `public.rls_auto_enable()` event-trigger helper was also restricted so anonymous/signed-in API clients cannot execute it. The automatic RLS trigger remains enabled. Supabase security advisors now report no warnings, only the intentional absence of public row policies on these server-only tables.

## 2. Confirm enquiry email

Keep `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `ENQUIRY_RECIPIENTS` configured in Render. Verify the sender domain in Resend. A saved enquiry returns HTTP 201 with its ID. `notification: "sent"` means the provider accepted the send; only provider delivery events or an inbox check prove delivery. `notification: "pending"` means the enquiry was saved but the staff email failed. Check `itinpro_enquiry_failure` logs for stage/code; no client details or keys are logged.

## Read-only sandbox key check

`GET /api/payments/status` verifies that the configured test key can read an existing ITIN PRO sandbox price. It never creates customers, enquiries, payments or invoices, and it works while `PAYMENTS_ENABLED=false`. HTTP 200 with `catalog: "ready"` proves access to the intended catalog; it does not prove payment completion or webhook reconciliation. Failures return a safe diagnostic code, never provider messages or credentials. Results are cached for 30 seconds.

The user explicitly approved sandbox testing on 12 October 2026. Keep payments disabled between test sessions; this approval permits further sandbox tests, not live payments.

## 3. Configure sandbox payments

Use only ITIN PRO LTD sandbox `acct_1UPPNq050EnIRMqj`. The application rejects live keys and events.

| Render setting | Value |
|---|---|
| `STRIPE_SECRET_KEY` | A sandbox restricted API key (`rk_test_…`) with Prices read, Checkout Sessions read/write, Customers read/write and Invoices read/write. Invoices write covers `/v1/invoiceitems`; no separate Invoice Items permission is needed. Leave Customer Sessions and Billable Items disabled |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the endpoint below; set securely in Render |
| `PAYMENT_TOKEN_SECRET` | At least 32 randomly generated bytes; signs checkout access links |
| `PAYMENT_ADMIN_TOKEN` | Separate random staff API authorisation secret; at least 32 characters |
| `APP_URL` | `https://itinpro-uk.onrender.com` |
| `PAYMENTS_ENABLED` | Keep `false` until the migration, sandbox key and webhook secret are configured; then set `true` for sandbox testing |

Webhook URL: `https://itinpro-uk.onrender.com/api/stripe/webhook`

Webhook version: `2026-08-26.dahlia`. Subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `invoice.paid`, `invoice.payment_failed`, and `invoice.voided`.

The handler verifies the signature over the raw body, rejects live events, checks amounts/currency/resource IDs, and atomically stores the event and payment status. Duplicate events are ignored; late failure events cannot overwrite a paid status. Database failures return HTTP 503 so Stripe retries.

## 4. Customer test journey

Submit a clearly marked synthetic enquiry with an `example.com` address. Once the database and payment settings work, the form offers **Continue to test payment**. Checkout uses the server's fixed category price. Unknown categories and separately quoted tax returns cannot be paid through this fixed-price endpoint. LLC/bank-account enquiries require LLC and EIN confirmation.

Retries for the same enquiry reuse the same order and Checkout Session. The return page reads payment status; it never marks an order paid. Payment confirmation depends on the verified webhook.

Use Stripe's documented sandbox payment methods. Never enter real bank/card or taxpayer data. Confirm the webhook event and `payment_orders.status = 'paid'`, then replay the event to check de-duplication.

## 5. Custom travel, courier and fee-difference invoices

Staff can use Stripe Dashboard invoicing, or the authenticated `POST /api/admin/invoices` endpoint. The endpoint requires `Authorization: Bearer <PAYMENT_ADMIN_TOKEN>` and works only when sandbox payments are enabled. Never put this token in frontend code.

Payload fields: a stable UUID `requestId`, customer `email`, customer `name`, and `lines`. Each line has `kind` (`travel`, `courier`, or `category_difference`), `description`, and positive integer `amount` in GBP pence. For example, 5000 means £50. Each line is capped at £2,000. Reusing a request ID with different details is rejected.

Before any database or Stripe writes, the endpoint verifies an existing ITIN PRO price against the sandbox catalog; a wrong-sandbox key or live price is rejected. The endpoint then creates and finalises an itemised no-VAT sandbox invoice and returns its hosted URL. It does not email the invoice automatically; staff review it before sending through Stripe Dashboard. `invoice.paid` reconciles the order using the same verified event flow.

## Validation

Run `npm test`, `npm run typecheck`, and `npm run build`. Tests cover malformed Supabase configuration, provider-returned email errors, server pricing, tampered/expired checkout links, live-key rejection, raw webhook signatures, unpaid completion, invoice amounts, and actual PostgreSQL event de-duplication and access grants.

The secure document portal is a separate priority task. This enquiry/payment flow does not collect passports or taxpayer identifiers.
