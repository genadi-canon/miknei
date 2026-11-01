import { prisma } from "./db";
import { getProvider } from "./payments";
import { checkSellerDetails, type SellerDetails } from "./validation";

export async function submitSellerDetails(sellerId: string, d: SellerDetails) {
  const problem = checkSellerDetails(d);
  if (problem) return { ok: false as const, error: problem };
  const clean = {
    name: d.name.trim().replace(/\s+/g, " "),
    nationalId: d.nationalId.replace(/\D/g, "").padStart(9, "0"),
    businessId: d.businessId?.replace(/\D/g, "") || null,
    bankCode: d.bankCode,
    branch: d.branch.replace(/\D/g, ""),
    account: d.account.replace(/\D/g, ""),
  };
  const seller = await prisma.seller.update({ where: { id: sellerId }, data: clean });
  // KYC is the processor's job: it checks the ID document and that the account belongs to the seller.
  const r = await getProvider().onboardSeller({ sellerId, phone: seller.phone, ...clean, businessId: clean.businessId ?? undefined });
  const kycStatus = r.status === "approved" ? "APPROVED" : r.status === "rejected" ? "REJECTED" : "PENDING";
  await prisma.seller.update({ where: { id: sellerId }, data: { providerMerchantId: r.merchantId, kycStatus } });
  return { ok: true as const, kycStatus };
}
