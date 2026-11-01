import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { currentSeller } from "@/lib/auth";

export default async function Home() {
  if (await currentSeller()) redirect("/dashboard");
  return (
    <main className="wrap">
      <Header />
      <section className="screen">
        <h1>תשלום מאובטח ליד שנייה, גם בתשלומים.</h1>
        <p className="sub">יוצרים קישור תשלום, שולחים לקונה, והוא משלם בכרטיס אשראי עד 6 תשלומים. הכרטיס מחויב רק אחרי שהקונה מאשר שקיבל את המוצר.</p>
        <p className="free"><b>miknei לא גובה עמלות. השירות ניתן חינם.</b></p>
        <Link className="btn" href="/signup">להתחיל למכור</Link>
        <p className="fine">קונים לא צריכים להירשם. מספיק לפתוח את הקישור מהמוכר.</p>
      </section>
    </main>
  );
}
