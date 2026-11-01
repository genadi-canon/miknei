import { randomUUID } from "node:crypto";
import type { CheckoutRequest, CheckoutResult, PaymentProvider } from "./types";

// In-memory stand-in for a real processor, for development and demos only.
interface MockCheckout extends CheckoutResult { req: CheckoutRequest }
interface MockAuth { amountAgorot: number; state: "held" | "captured" | "voided" }

const g = globalThis as unknown as { __mikneiMock?: { checkouts: Map<string, MockCheckout>; auths: Map<string, MockAuth> } };
const store = (g.__mikneiMock ??= { checkouts: new Map(), auths: new Map() });

export const MOCK_DECLINE_CARD = "4000000000000002";

export const mockProvider: PaymentProvider & {
  submitCard(checkoutId: string, cardNumber: string): CheckoutResult;
  peek(checkoutId: string): MockCheckout | undefined;
  authState(authorizationId: string): MockAuth | undefined;
} = {
  name: "mock",

  async onboardSeller(s) {
    return { merchantId: "mock_m_" + s.sellerId, status: "approved" };
  },

  async createCheckout(req) {
    const checkoutId = "mock_co_" + randomUUID();
    store.checkouts.set(checkoutId, { req, status: "pending", amountAgorot: req.amountAgorot, installments: req.installments });
    const base = process.env.APP_URL ?? "http://localhost:3000";
    return { checkoutId, redirectUrl: `${base}/mock-checkout/${checkoutId}` };
  },

  async getCheckout(checkoutId) {
    const c = store.checkouts.get(checkoutId);
    if (!c) throw new Error("unknown checkout");
    const { req: _req, ...result } = c;
    return result;
  },

  async capture(authorizationId) {
    const a = store.auths.get(authorizationId);
    if (!a) throw new Error("unknown authorization");
    if (a.state === "voided") throw new Error("authorization was voided");
    a.state = "captured";
  },

  async void(authorizationId) {
    const a = store.auths.get(authorizationId);
    if (!a) throw new Error("unknown authorization");
    if (a.state === "captured") throw new Error("authorization was captured");
    a.state = "voided";
  },

  // Called by the mock hosted card page. A real processor does this on its own domain.
  submitCard(checkoutId, cardNumber) {
    const c = store.checkouts.get(checkoutId);
    if (!c) throw new Error("unknown checkout");
    if (c.status !== "pending") return c;
    const num = cardNumber.replace(/\D/g, "");
    if (num.length < 12 || num === MOCK_DECLINE_CARD) {
      c.status = "failed";
      return c;
    }
    const authorizationId = "mock_auth_" + randomUUID();
    store.auths.set(authorizationId, { amountAgorot: c.amountAgorot, state: "held" });
    Object.assign(c, { status: "authorized", authorizationId, cardLast4: num.slice(-4) });
    return c;
  },

  peek: id => store.checkouts.get(id),
  authState: id => store.auths.get(id),
};
