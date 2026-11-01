import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { CopyLink } from "@/components/CopyLink";
import { StatusChip, Track } from "@/components/DealStatus";
import { SubmitButton } from "@/components/SubmitButton";
import { currentSeller } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { captureIfDue, dealLink } from "@/lib/deals";
import { formatIls, quote } from "@/lib/money";
import { cancelDealAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function SellerDeal({ params }: { params: Promise<{ id: string }> }) {
  const seller = await currentSeller();
  if (!seller) redirect("/signup");
  const { id } = await params;
  const found = await prisma.deal.findFirst({ where: { id, sellerId: seller.id } });
  if (!found) notFound();
  const d = await captureIfDue(found);
  const url = dealLink(d.code);
  const q = d.installments ? quote(d.priceAgorot, d.installments) : null;
  const wa = `https://wa.me/?text=${encodeURIComponent(`קישור לתשלום עבור ${d.title}: ${url}`)}`;
  return (
    <main className="wrap">
      <Header><a className="link-btn" href="/dashboard">לכל העסקאות</a></Header>
      <section className="screen">
        <h2>{d.title}</h2>
        <StatusChip status={d.status} view="seller" />
        {d.status === "LINKED" && <>
          <CopyLink url={url} />
          <a className="btn quiet" href={wa} target="_blank" rel="noopener noreferrer">שליחה בוואטסאפ</a>
        </>}
        <div className="rows">
          <div className="r"><span>מחיר שקבעת</span><span className="num">{formatIls(d.priceAgorot)}</span></div>
          {q && q.installments > 1 && <div className="r"><span>הקונה בחר</span><span>{q.installments} תשלומים</span></div>}
          {d.cardLast4 && <div className="r"><span>כרטיס</span><span className="num">•••• {d.cardLast4}</span></div>}
          {d.holdUntil && d.status === "AUTHORIZED" && <div className="r"><span>חיוב אוטומטי לכל המאוחר</span><span className="num">{d.holdUntil.toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}</span></div>}
        </div>
        <Track status={d.status} canceledBeforePay={d.status === "CANCELED" && !d.authorizedAt} />
        <p className="fine">החישוב לא כולל עלויות של ספקי שירות או של חברות האשראי, אם יחולו.</p>
        {d.status === "LINKED" && (
          <form action={cancelDealAction}>
            <input type="hidden" name="id" value={d.id} />
            <SubmitButton className="btn ghost">ביטול הקישור</SubmitButton>
          </form>
        )}
      </section>
    </main>
  );
}
