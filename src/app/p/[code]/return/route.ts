import { NextResponse, type NextRequest } from "next/server";
import { completeCheckout, DealError } from "@/lib/deals";

// The processor's hosted card page redirects here. Status comes from the processor API, not from the URL.
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const checkoutId = req.nextUrl.searchParams.get("checkout") ?? "";
  const back = new URL(`/p/${code}`, req.nextUrl.origin);
  try {
    const deal = await completeCheckout(code, checkoutId);
    if (deal.status === "LINKED") back.searchParams.set("failed", "1");
  } catch (e) {
    if (!(e instanceof DealError)) throw e;
    back.searchParams.set("failed", "1");
  }
  return NextResponse.redirect(back, 303);
}
