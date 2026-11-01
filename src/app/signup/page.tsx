import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { currentSeller } from "@/lib/auth";
import { PhoneForm } from "./PhoneForm";

export default async function SignupPage() {
  const seller = await currentSeller();
  if (seller) redirect(seller.kycStatus === "APPROVED" ? "/dashboard" : "/signup/details");
  return (
    <main className="wrap">
      <Header />
      <section className="screen"><PhoneForm /></section>
    </main>
  );
}
