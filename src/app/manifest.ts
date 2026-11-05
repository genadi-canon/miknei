import type { MetadataRoute } from "next";

/** Lets phones install miknei to the home screen as an app, with quick actions on long press (Android). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "miknei: תשלום מאובטח ביד שנייה",
    short_name: "miknei",
    description: "תשלום מאובטח גם ביד שנייה, עד 6 תשלומים. הכרטיס מחויב רק אחרי אישור קבלה.",
    lang: "he",
    dir: "rtl",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f2f4f1",
    theme_color: "#0b5d47",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "קישור תשלום חדש", short_name: "קישור חדש", url: "/dashboard/new", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "העסקאות שלי", short_name: "עסקאות", url: "/dashboard", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
