// The card processor (e.g. Rapyd) does everything that touches money or card data:
// seller KYC, the hosted card page, J5 authorization, capture, and paying the seller directly.
// miknei stores only ids returned by the processor, so it never holds funds or card numbers.

export interface SellerOnboarding {
  sellerId: string;
  name: string;
  nationalId: string;
  businessId?: string;
  phone: string;
  bankCode: string;
  branch: string;
  account: string;
}

export interface CheckoutRequest {
  dealId: string;
  merchantId: string; // the seller's sub-merchant id: payouts go to the seller, not to miknei
  amountAgorot: number;
  installments: number;
  description: string;
  returnUrl: string; // processor redirects here with ?checkout=<id>
}

export type CheckoutStatus = "pending" | "authorized" | "failed";

export interface CheckoutResult {
  status: CheckoutStatus;
  amountAgorot: number;
  installments: number;
  authorizationId?: string;
  cardLast4?: string;
}

export interface PaymentProvider {
  readonly name: string;
  onboardSeller(s: SellerOnboarding): Promise<{ merchantId: string; status: "approved" | "pending" | "rejected" }>;
  createCheckout(req: CheckoutRequest): Promise<{ checkoutId: string; redirectUrl: string }>;
  getCheckout(checkoutId: string): Promise<CheckoutResult>;
  /** Charge a J5 authorization. Must be idempotent. */
  capture(authorizationId: string): Promise<void>;
  /** Release a J5 authorization without charging. Must be idempotent. */
  void(authorizationId: string): Promise<void>;
}
