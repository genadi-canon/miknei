import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { currentSeller } from "@/lib/auth";
import { BANKS } from "@/lib/validation";
import { DetailsForm } from "./DetailsForm";

export default async function DetailsPage() {
  const s = await currentSeller();
  if (!s) redirect("/signup");
  if (s.kycStatus === "APPROVED") redirect("/dashboard");
  const initial = { name: s.name ?? "", nationalId: s.nationalId ?? "", businessId: s.businessId ?? "", bankCode: s.bankCode ?? "", branch: s.branch ?? "", account: s.account ?? "" };
  return (
    <main className="wrap">
      <Header />
      <section className="screen">
        {s.kycStatus === "REJECTED" && <p className="err">ספק הסליקה לא אישר את הפרטים. כדאי לבדוק אותם ולשלוח שוב.</p>}
        {s.kycStatus === "PENDING" && s.providerMerchantId
          ? <><h2>הפרטים בבדיקה</h2><p className="sub">ספק הסליקה בודק את הפרטים. נשלח SMS כשהחשבון יאושר.</p></>
          : <DetailsForm banks={Object.entries(BANKS)} initial={initial} />}
      </section>
    </main>
  );
}
