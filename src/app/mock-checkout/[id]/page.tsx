import { notFound } from "next/navigation";
import { formatIls } from "@/lib/money";
import { MOCK_DECLINE_CARD, mockProvider } from "@/lib/payments/mock";

export const dynamic = "force-dynamic";

// Stand-in for the processor's hosted card page. With a real processor this page lives on their domain.
export default async function MockCheckout({ params }: { params: Promise<{ id: string }> }) {
  if ((process.env.PAYMENT_PROVIDER ?? "mock") !== "mock" || (process.env.NODE_ENV === "production" && process.env.DEMO_MODE !== "1")) notFound();
  const { id } = await params;
  const c = await mockProvider.peek(id);
  if (!c) notFound();

  return (
    <main className="wrap">
      <header className="top"><b>ספק סליקה (הדמיה)</b><span className="pill">סביבת בדיקות</span></header>
      <section className="screen">
        <h2>אישור מסגרת על <span className="num">{formatIls(c.amountAgorot)}</span></h2>
        <p className="sub">{c.description} · {c.installments === 1 ? "תשלום אחד" : `${c.installments} תשלומים`}. הכרטיס לא יחויב עכשיו.</p>
        <form method="post" action={`/mock-checkout/${id}/submit`} className="stack">
          <div className="field"><label htmlFor="card">מספר כרטיס</label><input id="card" name="card" inputMode="numeric" defaultValue="4580 1111 2222 1234" /></div>
          <div className="row2">
            <div className="field"><label htmlFor="exp">תוקף</label><input id="exp" defaultValue="09/29" /></div>
            <div className="field"><label htmlFor="cvv">CVV</label><input id="cvv" defaultValue="123" /></div>
          </div>
          <button className="btn" type="submit">אישור</button>
        </form>
        <p className="fine">כרטיס לבדיקת סירוב: <span className="num">{MOCK_DECLINE_CARD}</span></p>
      </section>
    </main>
  );
}
