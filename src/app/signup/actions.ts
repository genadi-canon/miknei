"use server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentSeller, endSession, requestOtp, startSession, verifyOtp } from "@/lib/auth";
import { submitSellerDetails } from "@/lib/sellers";
import { showDevCodes } from "@/lib/sms";
import { normalizeMobile } from "@/lib/validation";

export type PhoneState = { step: "phone" | "code"; phone?: string; error?: string; devCode?: string };

export async function phoneAction(prev: PhoneState, form: FormData): Promise<PhoneState> {
  if (prev.step === "phone" || form.get("resend")) {
    const phone = normalizeMobile(String(form.get("phone") ?? prev.phone ?? ""));
    if (!phone) return { step: "phone", error: "מספר הטלפון צריך להיות נייד ישראלי, למשל 052-5550142." };
    const r = await requestOtp(phone);
    if (!r.ok) return { step: "phone", phone, error: r.error };
    return { step: "code", phone, devCode: showDevCodes() ? r.devCode : undefined };
  }
  const phone = prev.phone!;
  const code = String(form.get("code") ?? "").trim();
  if (!/^\d{4}$/.test(code)) return { ...prev, error: "קוד האימות הוא 4 ספרות." };
  if (!(await verifyOtp(phone, code))) return { ...prev, error: "הקוד שגוי או שפג תוקפו." };
  const seller = await prisma.seller.upsert({ where: { phone }, update: {}, create: { phone } });
  await startSession(seller.id);
  redirect(seller.kycStatus === "APPROVED" ? "/dashboard" : "/signup/details");
}

export type DetailsState = { error?: string; values?: Record<string, string>; at?: number };

export async function detailsAction(_prev: DetailsState, form: FormData): Promise<DetailsState> {
  const seller = await currentSeller();
  if (!seller) redirect("/signup");
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const r = await submitSellerDetails(seller.id, {
    name: get("name"), nationalId: get("nationalId"), businessId: get("businessId") || undefined,
    bankCode: get("bankCode"), branch: get("branch"), account: get("account"),
  });
  if (!r.ok) return { error: r.error, values: Object.fromEntries(["name", "nationalId", "businessId", "bankCode", "branch", "account"].map(k => [k, get(k)])), at: Date.now() };
  redirect("/dashboard?welcome=1");
}

export async function logoutAction() {
  await endSession();
  redirect("/");
}
