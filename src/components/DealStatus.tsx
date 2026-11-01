import { HOLD_HOURS } from "@/lib/dealMachine";

type S = "LINKED" | "AUTHORIZED" | "CAPTURED" | "CANCELED";

export function StatusChip({ status, view }: { status: S; view: "seller" | "buyer" }) {
  const map: Record<S, [string, string]> = {
    LINKED: ["wait", view === "seller" ? "ממתין לתשלום מהקונה" : "ממתין לתשלום"],
    AUTHORIZED: ["held", "הכרטיס אושר, טרם חויב"],
    CAPTURED: ["ok", view === "seller" ? "הכרטיס חויב, הכסף בדרך" : "העסקה הושלמה"],
    CANCELED: ["bad", "העסקה בוטלה"],
  };
  const [cls, text] = map[status];
  return <span className={`chip ${cls}`}><i />{text}</span>;
}

export function Track({ status, canceledBeforePay }: { status: S; canceledBeforePay?: boolean }) {
  const refunded = status === "CANCELED";
  const steps: [string, string][] = [
    ["הקישור נוצר", "שולחים לקונה בוואטסאפ או ב-SMS"],
    ["הקונה אישר כרטיס", "אישור מסגרת, בלי חיוב"],
    ["ממתין לאישור קבלה", `הכרטיס יחויב אחרי אישור או ${HOLD_HOURS} שעות`],
    refunded ? ["העסקה בוטלה", "הכרטיס לא חויב"] : ["הכרטיס חויב", "הכסף עובר ישירות לחשבון הבנק שלך"],
  ];
  const marks: Record<S, string[]> = {
    LINKED: ["done", "now", "", ""],
    AUTHORIZED: ["done", "done", "now", ""],
    CAPTURED: ["done", "done", "done", "done"],
    CANCELED: canceledBeforePay ? ["done", "", "", "fail"] : ["done", "done", "done", "fail"],
  };
  return (
    <ol className="track">
      {steps.map(([t, d], i) => (
        <li key={t} className={marks[status][i]}><span className="m" /><div><b>{t}</b><span>{d}</span></div></li>
      ))}
    </ol>
  );
}
