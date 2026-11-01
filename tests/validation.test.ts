import { describe, expect, it } from "vitest";
import { checkSellerDetails, normalizeMobile, validIsraeliId } from "@/lib/validation";

describe("validIsraeliId", () => {
  it.each(["012345674", "12345674", "000000018"])("accepts %s", id => expect(validIsraeliId(id)).toBe(true));
  it.each(["123456789", "012345675", "1234", "1234567890"])("rejects %s", id => expect(validIsraeliId(id)).toBe(false));
});

describe("normalizeMobile", () => {
  it.each([["052-555-0142", "0525550142"], ["+972 52 555 0142", "0525550142"], ["972525550142", "0525550142"]])("%s", (a, b) =>
    expect(normalizeMobile(a)).toBe(b));
  it.each(["03-5550142", "05255501", "abc"])("rejects %s", a => expect(normalizeMobile(a)).toBeNull());
});

describe("checkSellerDetails", () => {
  const ok = { name: "דנה מזרחי", nationalId: "012345674", bankCode: "12", branch: "615", account: "284517" };
  it("accepts valid details", () => expect(checkSellerDetails(ok)).toBeNull());
  it("requires full name", () => expect(checkSellerDetails({ ...ok, name: "דנה" })).toMatch(/שם/));
  it("checks ID", () => expect(checkSellerDetails({ ...ok, nationalId: "123456789" })).toMatch(/תעודת/));
  it("checks optional business id", () => expect(checkSellerDetails({ ...ok, businessId: "123456789" })).toMatch(/עוסק/));
  it("checks bank", () => expect(checkSellerDetails({ ...ok, bankCode: "99" })).toMatch(/בנק/));
  it("checks branch", () => expect(checkSellerDetails({ ...ok, branch: "61" })).toMatch(/סניף/));
  it("checks account", () => expect(checkSellerDetails({ ...ok, account: "12" })).toMatch(/חשבון/));
});
