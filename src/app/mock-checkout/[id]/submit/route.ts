import { NextResponse, type NextRequest } from "next/server";
import { mockProvider } from "@/lib/payments/mock";

// Plain form POST + redirect, the way a real processor's hosted page hands the buyer back.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if ((process.env.PAYMENT_PROVIDER ?? "mock") !== "mock") return new NextResponse(null, { status: 404 });
  const { id } = await params;
  const c = mockProvider.peek(id);
  if (!c) return new NextResponse(null, { status: 404 });
  const form = await req.formData();
  mockProvider.submitCard(id, String(form.get("card") ?? ""));
  return NextResponse.redirect(`${c.req.returnUrl}?checkout=${encodeURIComponent(id)}`, 303);
}
