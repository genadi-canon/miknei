# miknei

תשלום מאובטח ליד שנייה, גם בתשלומים. המוכר יוצר קישור תשלום, הקונה מאשר כרטיס (אישור מסגרת J5, בלי חיוב), והכרטיס מחויב רק אחרי שהקונה מאשר קבלה, או אוטומטית אחרי 48 שעות. miknei לא גובה עמלות, לא מחזיקה כסף ולא שומרת פרטי כרטיס.

Secure payments for second-hand sales in Israel, with installments. Next.js + Postgres (Prisma).

## Status

MVP running against a **mock** card processor and a **mock** SMS sender. No real money moves. A real processor adapter (Rapyd is the leading candidate) is added in `src/lib/payments/` once there is a contract and sandbox keys.

## Run locally

Requires Node 22+ and Postgres.

```bash
cp .env.example .env          # set DATABASE_URL
npm install
npx prisma migrate dev        # creates tables
npm run dev                   # http://localhost:3000
```

In dev, OTP codes are shown on screen and printed to the server log (`[sms:mock]`). On the mock card page, any 12+ digit card is approved; `4000000000000002` is declined.

## Tests

```bash
npm test        # unit tests + integration tests against DATABASE_URL
npm run lint    # typecheck
```

## Flow

| Status | Meaning | Next |
|---|---|---|
| `LINKED` | seller created the link | buyer authorizes card → `AUTHORIZED`; seller cancels → `CANCELED` |
| `AUTHORIZED` | J5 authorization held, card not charged | buyer confirms or 48h pass → `CAPTURED`; buyer reports not received → `CANCELED` (authorization voided) |
| `CAPTURED` | card charged, processor pays the seller directly | — |
| `CANCELED` | nothing charged | — |

Transitions live in `src/lib/dealMachine.ts` and are applied with conditional updates (`src/lib/deals.ts`), so a buyer click and the auto-capture job can't both capture.

## Layout

- `src/lib/money.ts` installment split (first payment absorbs rounding, no fees added)
- `src/lib/validation.ts` Israeli mobile, ID check digit, bank details format
- `src/lib/payments/` processor interface (`types.ts`) and mock implementation
- `src/lib/deals.ts` deal service: create, checkout, confirm, reject, auto-capture
- `src/lib/auth.ts` seller phone OTP login, session cookie
- `src/app/` pages: `/signup`, `/dashboard`, `/p/[code]` (buyer), `/mock-checkout/[id]`
- `src/app/api/cron/auto-capture` call every few minutes with `Authorization: Bearer $CRON_SECRET`

## Before production

- Real processor adapter: seller onboarding/KYC as sub-merchants with direct payouts, hosted card page, J5 + installments, capture, void, webhooks.
- J5 authorizations typically expire after about 5 days; confirm the limit with the processor.
- Real SMS gateway, rate limiting at the edge, per-bank account check digits (official spec).
- Legal review: Payment Services Law, terms of use, privacy policy.
