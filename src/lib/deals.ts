import type { Deal, Prisma } from "@prisma/client";
import { prisma } from "./db";
import { newDealCode, newToken, sha256, safeEqualHex } from "./crypto";
import { HOLD_HOURS, nextStatus, type DealAction, type DealStatus } from "./dealMachine";
import { formatIls, MAX_INSTALLMENTS, MAX_PRICE_ILS, MIN_PRICE_ILS } from "./money";
import { getProvider } from "./payments";
import { getSms } from "./sms";

export class DealError extends Error {}

const appUrl = () => process.env.APP_URL ?? "http://localhost:3000";
export const dealLink = (code: string) => `${appUrl()}/p/${code}`;
export const buyerCookie = (code: string) => `mb_${code}`;

async function log(dealId: string, type: string, data?: Prisma.InputJsonValue) {
  await prisma.dealEvent.create({ data: { dealId, type, data } });
}

/** Atomically move a deal from its current status. Returns the updated deal, or null if someone else moved it first. */
async function transition(deal: Deal, action: DealAction, data: Prisma.DealUpdateManyMutationInput = {}): Promise<Deal | null> {
  const to = nextStatus(deal.status as DealStatus, action);
  if (!to) return null;
  const r = await prisma.deal.updateMany({ where: { id: deal.id, status: deal.status }, data: { ...data, status: to } });
  if (r.count !== 1) return null;
  await log(deal.id, action, { from: deal.status, to });
  return prisma.deal.findUniqueOrThrow({ where: { id: deal.id } });
}

export async function createDeal(sellerId: string, input: { title: string; description: string; delivery: string; priceAgorot: number }) {
  const title = input.title.trim().slice(0, 80);
  if (!title) throw new DealError("צריך לכתוב מה מוכרים.");
  if (!(input.priceAgorot >= MIN_PRICE_ILS * 100 && input.priceAgorot <= MAX_PRICE_ILS * 100)) {
    throw new DealError(`המחיר צריך להיות בין ${MIN_PRICE_ILS} ל-${MAX_PRICE_ILS.toLocaleString("en-US")} ₪.`);
  }
  const delivery = input.delivery === "משלוח" ? "משלוח" : "איסוף עצמי";
  for (let i = 0; i < 5; i++) {
    try {
      const deal = await prisma.deal.create({
        data: { sellerId, code: newDealCode(), title, description: input.description.trim().slice(0, 240), delivery, priceAgorot: input.priceAgorot },
      });
      await log(deal.id, "created");
      return deal;
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e; // retry only on code collision
    }
  }
  throw new Error("could not allocate deal code");
}

export async function cancelBySeller(sellerId: string, dealId: string) {
  const deal = await prisma.deal.findFirst({ where: { id: dealId, sellerId } });
  if (!deal) throw new DealError("העסקה לא נמצאה.");
  const done = await transition(deal, "sellerCancel", { canceledAt: new Date(), cancelReason: "seller" });
  if (!done) throw new DealError("אפשר לבטל רק קישור שעוד לא שולם.");
  return done;
}

/** Buyer chose installments; send them to the processor's hosted card page. Returns redirect URL and a buyer token for a cookie. */
export async function startCheckout(code: string, installments: number, buyerPhone: string) {
  const deal = await prisma.deal.findUnique({ where: { code }, include: { seller: true } });
  if (!deal || deal.status !== "LINKED") throw new DealError("הקישור הזה כבר לא פעיל.");
  if (!deal.seller.providerMerchantId || deal.seller.kycStatus !== "APPROVED") throw new DealError("המוכר עדיין לא אומת.");
  if (!Number.isInteger(installments) || installments < 1 || installments > MAX_INSTALLMENTS) throw new DealError("מספר תשלומים לא תקין.");
  const { checkoutId, redirectUrl } = await getProvider().createCheckout({
    dealId: deal.id,
    merchantId: deal.seller.providerMerchantId,
    amountAgorot: deal.priceAgorot,
    installments,
    description: deal.title,
    returnUrl: `${appUrl()}/p/${code}/return`,
  });
  const buyerToken = newToken();
  const r = await prisma.deal.updateMany({
    where: { id: deal.id, status: "LINKED" },
    data: { checkoutId, installments, buyerPhone, buyerTokenHash: sha256(buyerToken) },
  });
  if (r.count !== 1) throw new DealError("הקישור הזה כבר לא פעיל.");
  await log(deal.id, "checkout_started", { installments });
  return { redirectUrl, buyerToken };
}

/** Processor redirected back. Trust only what the processor API says, never query parameters. */
export async function completeCheckout(code: string, checkoutId: string) {
  const deal = await prisma.deal.findUnique({ where: { code }, include: { seller: true } });
  if (!deal || deal.checkoutId !== checkoutId) throw new DealError("התשלום לא נמצא.");
  if (deal.status !== "LINKED") return deal; // already handled (page refresh)
  const result = await getProvider().getCheckout(checkoutId);
  if (result.status !== "authorized" || !result.authorizationId) {
    await log(deal.id, "checkout_" + result.status);
    return deal;
  }
  if (result.amountAgorot !== deal.priceAgorot || result.installments !== deal.installments) {
    await log(deal.id, "checkout_mismatch", { amount: result.amountAgorot, installments: result.installments });
    await getProvider().void(result.authorizationId);
    throw new DealError("פרטי התשלום לא תואמים לעסקה. הכרטיס לא חויב.");
  }
  const now = new Date();
  const updated = await transition(deal, "authorize", {
    authorizationId: result.authorizationId,
    cardLast4: result.cardLast4,
    authorizedAt: now,
    holdUntil: new Date(now.getTime() + HOLD_HOURS * 3600_000),
  });
  if (!updated) return prisma.deal.findUniqueOrThrow({ where: { id: deal.id } });
  await notify(deal.seller.phone, `${deal.title}: הכרטיס של הקונה אושר על ${formatIls(deal.priceAgorot)} ועוד לא חויב. החיוב יתבצע כשהקונה יאשר קבלה, או אחרי ${HOLD_HOURS} שעות.`);
  if (deal.buyerPhone) await notify(deal.buyerPhone, `miknei: הכרטיס שלך אושר ועוד לא חויב. אחרי שקיבלת את ${deal.title}, אפשר לאשר כאן: ${dealLink(code)}`);
  return updated;
}

export function isBuyer(deal: Pick<Deal, "buyerTokenHash">, token: string | undefined): boolean {
  return Boolean(token && deal.buyerTokenHash && safeEqualHex(deal.buyerTokenHash, sha256(token)));
}

async function captureDeal(deal: Deal, action: "confirm" | "autoCapture") {
  const claimed = await transition(deal, action, { capturedAt: new Date() });
  if (!claimed) return null;
  try {
    await getProvider().capture(deal.authorizationId!);
  } catch (e) {
    // Roll back so a retry (buyer or cron) can capture again.
    await prisma.deal.update({ where: { id: deal.id }, data: { status: "AUTHORIZED", capturedAt: null } });
    await log(deal.id, "capture_failed", { message: String(e) });
    throw e;
  }
  const seller = await prisma.seller.findUniqueOrThrow({ where: { id: deal.sellerId } });
  await notify(seller.phone, `${deal.title}: הכרטיס של הקונה חויב. הכסף עובר לחשבון הבנק שלך דרך ספק הסליקה.`);
  return claimed;
}

export async function buyerConfirm(code: string, buyerToken: string | undefined) {
  const deal = await prisma.deal.findUnique({ where: { code } });
  if (!deal || !isBuyer(deal, buyerToken)) throw new DealError("רק מי ששילם יכול לאשר את העסקה.");
  if (deal.status !== "AUTHORIZED") return deal;
  return (await captureDeal(deal, "confirm")) ?? prisma.deal.findUniqueOrThrow({ where: { id: deal.id } });
}

export async function buyerReject(code: string, buyerToken: string | undefined) {
  const deal = await prisma.deal.findUnique({ where: { code }, include: { seller: true } });
  if (!deal || !isBuyer(deal, buyerToken)) throw new DealError("רק מי ששילם יכול לבטל את העסקה.");
  if (deal.status !== "AUTHORIZED") return deal;
  const claimed = await transition(deal, "reject", { canceledAt: new Date(), cancelReason: "buyer_not_received" });
  if (!claimed) return prisma.deal.findUniqueOrThrow({ where: { id: deal.id } });
  await getProvider().void(deal.authorizationId!);
  await notify(deal.seller.phone, `${deal.title}: הקונה דיווח שלא קיבל את המוצר. העסקה בוטלה והכרטיס לא חויב.`);
  return claimed;
}

/** Run from a scheduler. Captures every authorization whose hold window has passed. */
export async function autoCaptureDue(now = new Date()) {
  const due = await prisma.deal.findMany({ where: { status: "AUTHORIZED", holdUntil: { lte: now } }, take: 100 });
  let captured = 0, failed = 0;
  for (const d of due) {
    try {
      if (await captureDeal(d, "autoCapture")) captured++;
    } catch {
      failed++;
    }
  }
  return { due: due.length, captured, failed };
}

async function notify(phone: string, text: string) {
  try {
    await getSms().send(phone, text);
  } catch (e) {
    console.error("sms failed", e);
  }
}
