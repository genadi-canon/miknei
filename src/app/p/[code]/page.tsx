import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { StatusChip } from "@/components/DealStatus";
import { prisma } from "@/lib/db";
import { HOLD_HOURS } from "@/lib/dealMachine";
import { buyerCookie, captureIfDue, isBuyer } from "@/lib/deals";
import { formatIls, quote } from "@/lib/money";
import { DecideForm } from "./DecideForm";
import { PayForm } from "./PayForm";

export const dynamic = "force-dynamic";

function shortName(name: string | null) {
  const parts = (name || "המוכר").split(/\s+/).filter(Boolean);
  return parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
}

export default async function BuyerPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ failed?: string }> }) {
  const { code } = await params;
  const { failed } = await searchParams;
  const found = await prisma.deal.findUnique({ where: { code }, include: { seller: { select: { name: true } } } });
  if (!found) notFound();
  const d = { ...found, ...(await captureIfDue(found)) };
  const me = isBuyer(d, (await cookies()).get(buyerCookie(code))?.value);
  const seller = shortName(d.seller.name);
  const q = quote(d.priceAgorot, d.installments ?? 1);

  let body: React.ReactNode;
  if (d.status === "LINKED") {
    body = <>
      <div className="item">
        <span className="sub">{seller} שלח/ה בקשת תשלום</span>
        <b>{d.title}</b>
        <span className="sub">{[d.description, d.delivery].filter(Boolean).join(" · ")}</span>
      </div>
      {failed && <p className="err" role="alert">הכרטיס לא אושר ולא חויב. אפשר לנסות שוב או כרטיס אחר.</p>}
      <PayForm code={code} priceAgorot={d.priceAgorot} />
    </>;
  } else if (d.status === "AUTHORIZED" && me) {
    body = <>
      <StatusChip status="AUTHORIZED" view="buyer" />
      <h2>הכרטיס שלך אושר על <span className="num">{formatIls(q.total)}</span>, אבל עוד לא חויב.</h2>
      <p className="sub">אחרי שמקבלים את {d.title} ובודקים שהכול תקין, מאשרים כאן. בלי תשובה תוך {HOLD_HOURS} שעות, העסקה תאושר אוטומטית.</p>
      <div className="rows">
        <div className="r"><span>יחויב אחרי אישור</span><span className="num">{formatIls(q.total)}</span></div>
        {q.installments > 1 && <div className="r"><span>מספר תשלומים</span><span>{q.installments}</span></div>}
        {d.holdUntil && <div className="r"><span>אישור אוטומטי ב-</span><span className="num">{d.holdUntil.toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}</span></div>}
      </div>
      <DecideForm code={code} />
    </>;
  } else if (d.status === "AUTHORIZED") {
    body = <><StatusChip status="AUTHORIZED" view="buyer" /><h2>העסקה הזו כבר שולמה.</h2><p className="sub">רק מי ששילם יכול לאשר קבלה, מהמכשיר שבו שילם.</p></>;
  } else if (d.status === "CAPTURED") {
    body = <>
      <StatusChip status="CAPTURED" view="buyer" />
      <h2>{me ? `תודה! הכרטיס חויב והכסף עובר אל ${seller}` : "העסקה הושלמה."}</h2>
      {me && <p className="sub">{q.installments === 1 ? "החיוב יופיע בדף החיוב הבא שלך." : `החיוב יתחלק ל-${q.installments} תשלומים בכרטיס שלך.`}</p>}
    </>;
  } else {
    body = <>
      <StatusChip status="CANCELED" view="buyer" />
      <h2>{d.authorizedAt ? "הכרטיס שלך לא חויב." : "הקישור בוטל על ידי המוכר."}</h2>
      {d.authorizedAt && <p className="sub">אישור המסגרת על <span className="num">{formatIls(q.total)}</span> שוחרר.</p>}
    </>;
  }

  return (
    <main className="wrap">
      <Header />
      <section className="screen">{body}</section>
    </main>
  );
}
