import { NextResponse, type NextRequest } from "next/server";
import { autoCaptureDue } from "@/lib/deals";

// Call every few minutes from a scheduler (e.g. Vercel Cron, GitHub Actions, or a system cron with curl).
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await autoCaptureDue());
}
export const GET = POST;
