// miknei charges no fees. Buyers see only the known amount; processor or card costs are not estimated here.
export const MAX_INSTALLMENTS = 6;
export const MIN_PRICE_ILS = 50;
export const MAX_PRICE_ILS = 20_000;

export interface Quote {
  total: number; // agorot
  installments: number;
  first: number; // agorot
  each: number; // agorot, for payments 2..n
}

/** Split a price into installments. Israeli convention: the first payment absorbs the rounding. */
export function quote(priceAgorot: number, installments: number): Quote {
  if (!Number.isInteger(priceAgorot) || priceAgorot <= 0) throw new Error("invalid price");
  if (!Number.isInteger(installments) || installments < 1 || installments > MAX_INSTALLMENTS) {
    throw new Error("invalid installments");
  }
  const each = Math.floor(priceAgorot / installments);
  const first = priceAgorot - each * (installments - 1);
  return { total: priceAgorot, installments, first, each };
}

/** Parse a user-typed shekel amount ("2,000" / "199.90") into agorot, or null. */
export function parseShekels(raw: string): number | null {
  const s = String(raw).replace(/[,\s₪]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

export function formatIls(agorot: number): string {
  return "₪" + (agorot / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
