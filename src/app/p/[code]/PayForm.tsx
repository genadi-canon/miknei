"use client";
import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { formatIls, MAX_INSTALLMENTS, quote } from "@/lib/money";
import { payAction, type PayState } from "./actions";

export function PayForm({ code, priceAgorot }: { code: string; priceAgorot: number }) {
  const [state, action] = useActionState<PayState, FormData>(payAction.bind(null, code), {});
  const [n, setN] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const q = quote(priceAgorot, n);
  return (
    <form action={action} className="stack" noValidate>
      <div className="field">
        <label htmlFor="installments">מספר תשלומים</label>
        <select id="installments" name="installments" value={n} onChange={e => setN(Number(e.target.value))}>
          {Array.from({ length: MAX_INSTALLMENTS }, (_, i) => i + 1).map(k => (
            <option key={k} value={k}>{k === 1 ? "תשלום אחד" : `${k} תשלומים`}</option>
          ))}
        </select>
      </div>
      <p className="free"><b>miknei לא גובה עמלות. השירות ניתן חינם.</b></p>
      <div className="rows">
        <div className="r"><span>מחיר המוצר</span><span className="num">{formatIls(q.total)}</span></div>
        <div className="r total"><span>סה״כ</span><span className="num">{formatIls(q.total)}</span></div>
        {n > 1 && (
          <div className="r">
            <span>{q.first === q.each ? `${n} תשלומים של` : `תשלום ראשון, ואז ${n - 1} של`}</span>
            <span className="num">{q.first === q.each ? formatIls(q.each) : `${formatIls(q.first)} / ${formatIls(q.each)}`}</span>
          </div>
        )}
      </div>
      <p className="fine">החישוב לא כולל עלויות של ספקי שירות או של חברות האשראי, אם יחולו.</p>
      <div className="field">
        <label htmlFor="phone">טלפון נייד לעדכונים</label>
        <input id="phone" name="phone" inputMode="tel" autoComplete="tel" placeholder="05X-XXXXXXX" defaultValue={state.phone} />
      </div>
      <label className="check">
        <input type="checkbox" name="terms" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
        <span>הבנתי שהעסקה היא ביני לבין המוכר, הכרטיס יחויב רק אחרי שאאשר קבלה, ו-miknei לא אחראית למוצר.</span>
      </label>
      {state.error && <p className="err" role="alert">{state.error}</p>}
      <SubmitButton disabled={!agreed}>{`להזנת כרטיס, ${formatIls(q.total)}`}</SubmitButton>
      <p className="fine">פרטי הכרטיס מוזנים בדף המאובטח של ספק הסליקה. miknei לא רואה ולא שומרת אותם.</p>
    </form>
  );
}
