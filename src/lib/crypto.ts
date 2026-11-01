import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");
export const newOtp = () => String(randomInt(0, 10_000)).padStart(4, "0");

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no look-alikes
export function newDealCode(len = 8): string {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[randomInt(0, ALPHABET.length)];
  return s;
}

export function safeEqualHex(a: string, b: string): boolean {
  const x = Buffer.from(a, "hex"), y = Buffer.from(b, "hex");
  return x.length === y.length && timingSafeEqual(x, y);
}
