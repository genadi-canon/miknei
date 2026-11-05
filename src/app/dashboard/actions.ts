"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentSeller } from "@/lib/auth";
import { cancelBySeller, createDeal, DealError, sendLinkBySms } from "@/lib/deals";
import { showDevCodes } from "@/lib/sms";
import { parseShekels } from "@/lib/money";

async function requireApprovedSeller() {
  const s = await currentSeller();
  if (!s) redirect("/signup");
  if (s.kycStatus !== "APPROVED") redirect("/signup/details");
  return s;
}

export type NewDealState = { error?: string; values?: Record<string, string>; at?: number };

export async function newDealAction(_prev: NewDealState, form: FormData): Promise<NewDealState> {
  const seller = await requireApprovedSeller();
  const values = Object.fromEntries(["title", "price", "delivery", "description"].map(k => [k, String(form.get(k) ?? "")]));
  const at = Date.now();
  const priceAgorot = parseShekels(String(form.get("price") ?? ""));
  if (priceAgorot === null) return { error: "המחיר צריך להיות מספר, למשל 2000.", values, at };
  let id: string;
  try {
    const deal = await createDeal(seller.id, {
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      delivery: String(form.get("delivery") ?? ""),
      priceAgorot,
    });
    id = deal.id;
  } catch (e) {
    if (e instanceof DealError) return { error: e.message, values, at };
    throw e;
  }
  redirect(`/dashboard/deals/${id}`);
}

export async function cancelDealAction(form: FormData) {
  const seller = await requireApprovedSeller();
  const id = String(form.get("id"));
  try { await cancelBySeller(seller.id, id); } catch (e) { if (!(e instanceof DealError)) throw e; }
  revalidatePath(`/dashboard/deals/${id}`);
}

export type SendLinkState = { error?: string; sentTo?: string; demoText?: string; phone?: string; at?: number };

export async function sendLinkAction(_prev: SendLinkState, form: FormData): Promise<SendLinkState> {
  const seller = await requireApprovedSeller();
  const phone = String(form.get("phone") ?? "");
  const at = Date.now();
  try {
    const r = await sendLinkBySms(seller.id, String(form.get("id")), phone);
    return { sentTo: r.phone, demoText: showDevCodes() ? r.text : undefined, at };
  } catch (e) {
    if (e instanceof DealError) return { error: e.message, phone, at };
    throw e;
  }
}
