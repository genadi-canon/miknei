import { randomUUID } from "node:crypto";
import { prisma } from "../db";
import type { CheckoutResult, PaymentProvider } from "./types";

// Stand-in for a real processor, for development and demos only. No money moves.
// State lives in the database so it works when requests land on different server instances.

export const MOCK_DECLINE_CARD = "4000000000000002";

const toResult = (c: { status: string; amountAgorot: number; installments: number; authorizationId: string | null; cardLast4: string | null }): CheckoutResult => ({
  status: c.status as CheckoutResult["status"],
  amountAgorot: c.amountAgorot,
  installments: c.installments,
  authorizationId: c.authorizationId ?? undefined,
  cardLast4: c.cardLast4 ?? undefined,
});

export const mockProvider = {
  name: "mock",

  async onboardSeller(s) {
    return { merchantId: "mock_m_" + s.sellerId, status: "approved" as const };
  },

  async createCheckout(req) {
    const id = "mock_co_" + randomUUID();
    await prisma.mockCheckout.create({
      data: { id, dealId: req.dealId, merchantId: req.merchantId, amountAgorot: req.amountAgorot, installments: req.installments, description: req.description, returnUrl: req.returnUrl },
    });
    const base = process.env.APP_URL ?? "http://localhost:3000";
    return { checkoutId: id, redirectUrl: `${base}/mock-checkout/${id}` };
  },

  async getCheckout(checkoutId) {
    return toResult(await prisma.mockCheckout.findUniqueOrThrow({ where: { id: checkoutId } }));
  },

  async capture(authorizationId) {
    const r = await prisma.mockAuthorization.updateMany({ where: { id: authorizationId, state: { in: ["held", "captured"] } }, data: { state: "captured" } });
    if (r.count !== 1) throw new Error("authorization missing or voided");
  },

  async void(authorizationId) {
    const r = await prisma.mockAuthorization.updateMany({ where: { id: authorizationId, state: { in: ["held", "voided"] } }, data: { state: "voided" } });
    if (r.count !== 1) throw new Error("authorization missing or captured");
  },

  /** Called by the mock hosted card page. A real processor does this on its own domain. */
  async submitCard(checkoutId: string, cardNumber: string): Promise<CheckoutResult> {
    const c = await prisma.mockCheckout.findUniqueOrThrow({ where: { id: checkoutId } });
    if (c.status !== "pending") return toResult(c);
    const num = cardNumber.replace(/\D/g, "");
    if (num.length < 12 || num === MOCK_DECLINE_CARD) {
      return toResult(await prisma.mockCheckout.update({ where: { id: checkoutId }, data: { status: "failed" } }));
    }
    const authorizationId = "mock_auth_" + randomUUID();
    return prisma.$transaction(async tx => {
      const claimed = await tx.mockCheckout.updateMany({ where: { id: checkoutId, status: "pending" }, data: { status: "authorized", authorizationId, cardLast4: num.slice(-4) } });
      if (claimed.count === 1) await tx.mockAuthorization.create({ data: { id: authorizationId, amountAgorot: c.amountAgorot, state: "held" } });
      return toResult(await tx.mockCheckout.findUniqueOrThrow({ where: { id: checkoutId } }));
    });
  },

  peek: (checkoutId: string) => prisma.mockCheckout.findUnique({ where: { id: checkoutId } }),
  authState: (authorizationId: string) => prisma.mockAuthorization.findUnique({ where: { id: authorizationId } }),
} satisfies PaymentProvider & Record<string, unknown>;
