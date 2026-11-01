"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { buyerConfirm, buyerCookie, buyerReject, DealError, startCheckout } from "@/lib/deals";
import { normalizeMobile } from "@/lib/validation";


export type PayState = { error?: string; phone?: string };

export async function payAction(code: string, _prev: PayState, form: FormData): Promise<PayState> {
  const typed = String(form.get("phone") ?? "");
  if (form.get("terms") !== "on") return { error: "צריך לאשר את התנאים.", phone: typed };
  const phone = normalizeMobile(typed);
  if (!phone) return { error: "צריך מספר נייד ישראלי לקבלת עדכונים על העסקה.", phone: typed };
  let redirectUrl: string;
  try {
    const r = await startCheckout(code, Number(form.get("installments")), phone);
    (await cookies()).set(buyerCookie(code), r.buyerToken, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: `/p/${code}`, maxAge: 30 * 24 * 3600,
    });
    redirectUrl = r.redirectUrl;
  } catch (e) {
    if (e instanceof DealError) return { error: e.message, phone: typed };
    throw e;
  }
  redirect(redirectUrl);
}

export type ConfirmState = { error?: string };

export async function decideAction(code: string, _prev: ConfirmState, form: FormData): Promise<ConfirmState> {
  const token = (await cookies()).get(buyerCookie(code))?.value;
  try {
    if (form.get("decision") === "confirm") await buyerConfirm(code, token);
    else await buyerReject(code, token);
  } catch (e) {
    if (e instanceof DealError) return { error: e.message };
    console.error(e);
    return { error: "משהו השתבש מול ספק הסליקה. אפשר לנסות שוב בעוד רגע." };
  }
  revalidatePath(`/p/${code}`);
  return {};
}
