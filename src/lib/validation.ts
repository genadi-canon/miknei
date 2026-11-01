const digits = (v: string) => String(v).replace(/[\s-]/g, "");

/** Israeli mobile number → normalized 05XXXXXXXX, or null. Accepts +972 / 972 prefixes. */
export function normalizeMobile(raw: string): string | null {
  let d = digits(raw).replace(/^\+/, "");
  if (d.startsWith("972")) d = "0" + d.slice(3);
  return /^05\d{8}$/.test(d) ? d : null;
}

/** Israeli ID / business number check digit (Luhn-like, weights 1,2). */
export function validIsraeliId(raw: string): boolean {
  const id = String(raw).replace(/\D/g, "");
  if (id.length < 5 || id.length > 9) return false;
  const d = id.padStart(9, "0");
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const x = Number(d[i]) * ((i % 2) + 1);
    sum += x > 9 ? x - 9 : x;
  }
  return sum % 10 === 0;
}

export const BANKS: Record<string, string> = {
  "12": "הפועלים",
  "10": "לאומי",
  "11": "דיסקונט",
  "20": "מזרחי טפחות",
  "31": "הבינלאומי",
  "17": "מרכנתיל",
  "14": "אוצר החייל",
  "4": "יהב",
  "9": "הדואר",
  "54": "ירושלים",
  "18": "וואן זירו",
};

export interface SellerDetails {
  name: string;
  nationalId: string;
  businessId?: string;
  bankCode: string;
  branch: string;
  account: string;
}

/**
 * Format checks only. Whether the person and account are real is verified by the card processor (KYC).
 * TODO: per-bank account check digits, from the official Bank of Israel / MASAV spec.
 */
export function checkSellerDetails(s: SellerDetails): string | null {
  if (s.name.trim().split(/\s+/).filter(Boolean).length < 2) return "צריך שם פרטי ושם משפחה.";
  if (!validIsraeliId(s.nationalId)) return "מספר תעודת הזהות לא תקין. כדאי לבדוק את הספרות ואת ספרת הביקורת.";
  if (s.businessId && !validIsraeliId(s.businessId)) return "מספר העוסק לא תקין.";
  if (!BANKS[s.bankCode]) return "צריך לבחור בנק.";
  if (!/^\d{3}$/.test(digits(s.branch))) return "מספר סניף הוא 3 ספרות.";
  if (!/^\d{4,9}$/.test(digits(s.account))) return "מספר חשבון הוא בין 4 ל-9 ספרות.";
  return null;
}
