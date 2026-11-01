"use client";
import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { newDealAction, type NewDealState } from "../actions";

export function NewDealForm() {
  const [state, action] = useActionState<NewDealState, FormData>(newDealAction, {});
  const v = state.values ?? {};
  return (
    <form key={state.at ?? 0} action={action} className="stack" noValidate>
      <h2>קישור תשלום חדש</h2>
      <p className="sub">מתארים את המוצר וקובעים מחיר. השירות חינמי, ו-miknei לא גובה עמלות.</p>
      <div className="field"><label htmlFor="title">מה מוכרים</label><input id="title" name="title" maxLength={80} required defaultValue={v.title} /></div>
      <div className="row2">
        <div className="field"><label htmlFor="price">מחיר (₪)</label><input id="price" name="price" inputMode="decimal" required defaultValue={v.price} /></div>
        <div className="field"><label htmlFor="delivery">מסירה</label>
          <select id="delivery" name="delivery" defaultValue={v.delivery || "איסוף עצמי"}><option>איסוף עצמי</option><option>משלוח</option></select>
        </div>
      </div>
      <div className="field"><label htmlFor="description">תיאור קצר</label><textarea id="description" name="description" maxLength={240} defaultValue={v.description} /></div>
      {state.error && <p className="err" role="alert">{state.error}</p>}
      <SubmitButton>יצירת קישור תשלום</SubmitButton>
    </form>
  );
}
