// Runs against the database in DATABASE_URL with the mock processor.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { autoCaptureDue, buyerConfirm, buyerReject, cancelBySeller, completeCheckout, createDeal, DealError, startCheckout } from "@/lib/deals";
import { mockProvider } from "@/lib/payments/mock";
import { submitSellerDetails } from "@/lib/sellers";

const phone = "05" + String(Date.now()).slice(-8);
let sellerId = "";

beforeAll(async () => {
  const s = await prisma.seller.create({ data: { phone } });
  sellerId = s.id;
  const r = await submitSellerDetails(sellerId, { name: "דנה מזרחי", nationalId: "012345674", bankCode: "12", branch: "615", account: "284517" });
  expect(r).toEqual({ ok: true, kycStatus: "APPROVED" });
});
afterAll(async () => {
  await prisma.deal.deleteMany({ where: { sellerId } });
  await prisma.seller.delete({ where: { id: sellerId } });
  await prisma.$disconnect();
});

async function paidDeal(installments = 3, card = "4580111122221234") {
  const deal = await createDeal(sellerId, { title: "אופניים", description: "", delivery: "איסוף עצמי", priceAgorot: 200_000 });
  const { redirectUrl, buyerToken } = await startCheckout(deal.code, installments, "0521234567");
  const checkoutId = redirectUrl.split("/").pop()!;
  mockProvider.submitCard(checkoutId, card);
  const after = await completeCheckout(deal.code, checkoutId);
  return { deal: after, buyerToken };
}

describe("deal flow", () => {
  it("validates price range", async () => {
    await expect(createDeal(sellerId, { title: "x", description: "", delivery: "", priceAgorot: 4_999 })).rejects.toBeInstanceOf(DealError);
    await expect(createDeal(sellerId, { title: "x", description: "", delivery: "", priceAgorot: 2_000_001 })).rejects.toBeInstanceOf(DealError);
  });

  it("authorizes then captures on buyer confirmation", async () => {
    const { deal, buyerToken } = await paidDeal();
    expect(deal.status).toBe("AUTHORIZED");
    expect(deal.cardLast4).toBe("1234");
    expect(deal.installments).toBe(3);
    expect(mockProvider.authState(deal.authorizationId!)?.state).toBe("held");

    await expect(buyerConfirm(deal.code, "wrong-token")).rejects.toBeInstanceOf(DealError);
    const done = await buyerConfirm(deal.code, buyerToken);
    expect(done.status).toBe("CAPTURED");
    expect(mockProvider.authState(deal.authorizationId!)?.state).toBe("captured");
    // second click is a no-op
    expect((await buyerReject(deal.code, buyerToken)).status).toBe("CAPTURED");
  });

  it("voids when buyer reports not received", async () => {
    const { deal, buyerToken } = await paidDeal(1);
    const done = await buyerReject(deal.code, buyerToken);
    expect(done.status).toBe("CANCELED");
    expect(mockProvider.authState(deal.authorizationId!)?.state).toBe("voided");
  });

  it("stays LINKED when the card is declined", async () => {
    const { deal } = await paidDeal(1, "4000000000000002");
    expect(deal.status).toBe("LINKED");
  });

  it("seller can cancel only before payment", async () => {
    const d = await createDeal(sellerId, { title: "כיסא", description: "", delivery: "משלוח", priceAgorot: 10_000 });
    expect((await cancelBySeller(sellerId, d.id)).status).toBe("CANCELED");
    const { deal } = await paidDeal();
    await expect(cancelBySeller(sellerId, deal.id)).rejects.toBeInstanceOf(DealError);
  });

  it("auto-captures after the hold window", async () => {
    const { deal } = await paidDeal();
    await prisma.deal.update({ where: { id: deal.id }, data: { holdUntil: new Date(Date.now() - 1000) } });
    const r = await autoCaptureDue();
    expect(r.captured).toBeGreaterThanOrEqual(1);
    expect((await prisma.deal.findUniqueOrThrow({ where: { id: deal.id } })).status).toBe("CAPTURED");
  });

  it("confirm and auto-capture racing capture only once", async () => {
    const { deal, buyerToken } = await paidDeal();
    await prisma.deal.update({ where: { id: deal.id }, data: { holdUntil: new Date(Date.now() - 1000) } });
    await Promise.all([buyerConfirm(deal.code, buyerToken), autoCaptureDue()]);
    const events = await prisma.dealEvent.findMany({ where: { dealId: deal.id, type: { in: ["confirm", "autoCapture"] } } });
    expect(events).toHaveLength(1);
  });
});
