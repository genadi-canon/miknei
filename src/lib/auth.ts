import { cookies } from "next/headers";
import { prisma } from "./db";
import { newOtp, newToken, sha256, safeEqualHex } from "./crypto";
import { getSms } from "./sms";

const OTP_TTL_MS = 10 * 60_000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_PER_HOUR = 5;
const SESSION_TTL_MS = 30 * 24 * 3600_000;
export const SESSION_COOKIE = "miknei_session";

export async function requestOtp(phone: string): Promise<{ ok: true; devCode?: string } | { ok: false; error: string }> {
  const recent = await prisma.otpCode.count({ where: { phone, createdAt: { gt: new Date(Date.now() - 3600_000) } } });
  if (recent >= OTP_MAX_PER_HOUR) return { ok: false, error: "נשלחו יותר מדי קודים. אפשר לנסות שוב בעוד שעה." };
  const code = newOtp();
  await prisma.otpCode.create({ data: { phone, codeHash: sha256(phone + ":" + code), expiresAt: new Date(Date.now() + OTP_TTL_MS) } });
  await getSms().send(phone, `קוד האימות שלך ב-miknei: ${code}`);
  return { ok: true, devCode: code };
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const otp = await prisma.otpCode.findFirst({
    where: { phone, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.attempts >= OTP_MAX_ATTEMPTS) return false;
  if (!safeEqualHex(otp.codeHash, sha256(phone + ":" + code))) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return false;
  }
  const used = await prisma.otpCode.updateMany({ where: { id: otp.id, usedAt: null }, data: { usedAt: new Date() } });
  return used.count === 1;
}

export async function startSession(sellerId: string) {
  const token = newToken();
  await prisma.session.create({ data: { tokenHash: sha256(token), sellerId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function currentSeller() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const s = await prisma.session.findUnique({ where: { tokenHash: sha256(token) }, include: { seller: true } });
  if (!s || s.expiresAt < new Date()) return null;
  return s.seller;
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}
