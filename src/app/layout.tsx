import type { Metadata, Viewport } from "next";
import "./globals.css";
import { isDemo } from "@/lib/sms";

export const metadata: Metadata = {
  title: "miknei",
  description: "תשלום מאובטח ליד שנייה, גם בתשלומים. הכרטיס מחויב רק אחרי אישור קבלה.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Secular+One&family=Sora:wght@700&family=IBM+Plex+Sans+Hebrew:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap"
        />
      </head>
      <body>
        {isDemo() && <p className="demo-bar">גרסת הדגמה: אין חיוב אמיתי, וקודי SMS מוצגים על המסך.</p>}
        {children}
      </body>
    </html>
  );
}
