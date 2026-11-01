"use client";
import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [label, setLabel] = useState("העתקה");
  return (
    <div className="linkbox">
      <span className="num">{url.replace(/^https?:\/\//, "")}</span>
      <button className="link-btn" type="button" onClick={async () => {
        try { await navigator.clipboard.writeText(url); setLabel("הועתק"); } catch { setLabel("לא הועתק"); }
      }}>{label}</button>
    </div>
  );
}
