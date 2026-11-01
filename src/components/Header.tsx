import Link from "next/link";

export function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className="top">
      <Link href="/" className="brand" dir="ltr">miknei<span className="dot">.</span></Link>
      <div className="top-side">{children}</div>
    </header>
  );
}
