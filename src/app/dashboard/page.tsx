import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { StatusChip } from "@/components/DealStatus";
import { currentSeller } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatIls } from "@/lib/money";
import { logoutAction } from "../signup/actions";

export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const seller = await currentSeller();
  if (!seller) redirect("/signup");
  if (seller.kycStatus !== "APPROVED") redirect("/signup/details");
  const { welcome } = await searchParams;
  const deals = await prisma.deal.findMany({ where: { sellerId: seller.id }, orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <main className="wrap">
      <Header>
        <span>{seller.name}</span>
        <form action={logoutAction}><button className="link-btn" type="submit">יציאה</button></form>
      </Header>
      {welcome && <p className="free"><b>החשבון אומת.</b> מעכשיו אפשר ליצור קישורי תשלום ללא הגבלה.</p>}
      <Link className="btn" href="/dashboard/new">קישור תשלום חדש</Link>
      {deals.length === 0
        ? <p className="sub">עוד אין עסקאות. הקישור הראשון לוקח חצי דקה.</p>
        : (
          <ul className="deal-list">
            {deals.map(d => (
              <li key={d.id}>
                <Link href={`/dashboard/deals/${d.id}`}>
                  <span className="t"><b>{d.title}</b><StatusChip status={d.status} view="seller" /></span>
                  <span className="num">{formatIls(d.priceAgorot)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
    </main>
  );
}
