"use client";
import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { detailsAction, type DetailsState } from "../actions";

export function DetailsForm({ banks, initial }: { banks: [string, string][]; initial: Record<string, string> }) {
  const [state, action] = useActionState<DetailsState, FormData>(detailsAction, {});
  // React resets the form after each submit. Remounting it (key) with the submitted values keeps what the user typed.
  const v = state.values ?? initial;
  return (
    <form key={state.at ?? 0} action={action} className="stack" noValidate>
      <span className="steps">רישום מוכר · שלב 2 מתוך 2</span>
      <h2>פרטים אישיים וחשבון בנק</h2>
      <p className="sub">הפרטים נבדקים מול ספק הסליקה ולא מוצגים לקונים. הכסף מהקונים עובר ישירות לחשבון שלך.</p>
      <div className="field"><label htmlFor="name">שם מלא</label><input id="name" name="name" autoComplete="name" defaultValue={v.name} /></div>
      <div className="row2">
        <div className="field"><label htmlFor="nationalId">תעודת זהות</label><input id="nationalId" name="nationalId" inputMode="numeric" defaultValue={v.nationalId} /></div>
        <div className="field"><label htmlFor="businessId">מספר עוסק (לעסק קטן)</label><input id="businessId" name="businessId" inputMode="numeric" placeholder="לא חובה" defaultValue={v.businessId} /></div>
      </div>
      <div className="row2">
        <div className="field"><label htmlFor="bankCode">בנק</label>
          <select id="bankCode" name="bankCode" defaultValue={v.bankCode || ""}>
            <option value="" disabled>בחירה</option>
            {banks.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="branch">סניף</label><input id="branch" name="branch" inputMode="numeric" maxLength={3} defaultValue={v.branch} /></div>
      </div>
      <div className="field"><label htmlFor="account">מספר חשבון</label><input id="account" name="account" inputMode="numeric" defaultValue={v.account} /></div>
      {state.error && <p className="err" role="alert">{state.error}</p>}
      <SubmitButton>שליחה לאימות</SubmitButton>
      <p className="fine">כאן נבדקות ספרת הביקורת בתעודת הזהות ומבנה החשבון. ספק הסליקה מוודא שהחשבון קיים ושייך לך.</p>
    </form>
  );
}
