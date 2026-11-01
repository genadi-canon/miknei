import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { currentSeller } from "@/lib/auth";
import { NewDealForm } from "./NewDealForm";

export default async function NewDealPage() {
  const s = await currentSeller();
  if (!s) redirect("/signup");
  if (s.kycStatus !== "APPROVED") redirect("/signup/details");
  return (
    <main className="wrap">
      <Header><a className="link-btn" href="/dashboard">לכל העסקאות</a></Header>
      <section className="screen"><NewDealForm /></section>
    </main>
  );
}
