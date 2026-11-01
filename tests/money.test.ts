import { describe, expect, it } from "vitest";
import { formatIls, parseShekels, quote } from "@/lib/money";

describe("quote", () => {
  it("splits evenly when possible", () => {
    expect(quote(200_000, 4)).toEqual({ total: 200_000, installments: 4, first: 50_000, each: 50_000 });
  });
  it("first payment absorbs rounding", () => {
    const q = quote(200_000, 6); // 2,000 ₪ / 6
    expect(q.each).toBe(33_333);
    expect(q.first).toBe(33_335);
    expect(q.first + q.each * 5).toBe(200_000);
  });
  it("never adds fees", () => {
    for (let n = 1; n <= 6; n++) expect(quote(123_457, n).total).toBe(123_457);
  });
  it("rejects bad input", () => {
    expect(() => quote(100, 0)).toThrow();
    expect(() => quote(100, 7)).toThrow();
    expect(() => quote(-1, 1)).toThrow();
    expect(() => quote(10.5, 1)).toThrow();
  });
});

describe("parseShekels", () => {
  it.each([["2000", 200_000], ["2,000", 200_000], ["199.9", 19_990], ["₪ 50.05", 5_005]])("%s", (s, v) => expect(parseShekels(s)).toBe(v));
  it.each(["", "abc", "1.234", "-5", "1e3"])("rejects %s", s => expect(parseShekels(s)).toBeNull());
});

it("formats", () => expect(formatIls(33_335)).toBe("₪333.35"));
