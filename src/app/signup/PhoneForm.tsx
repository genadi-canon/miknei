"use client";
import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { phoneAction, type PhoneState } from "./actions";

export function PhoneForm() {
  const [state, action] = useActionState<PhoneState, FormData>(phoneAction, { step: "phone" });
  if (state.step === "phone") {
    return (
      <form action={action} className="stack" noValidate>
        <span className="steps">רישום מוכר · שלב 1 מתוך 2</span>
        <h2>מה מספר הטלפון שלך?</h2>
        <p className="sub">נשלח קוד אימות ב-SMS. אין צורך להתקין אפליקציה.</p>
        <div className="field">
          <label htmlFor="phone">טלפון נייד</label>
          <input id="phone" name="phone" inputMode="tel" autoComplete="tel" defaultValue={state.phone} placeholder="05X-XXXXXXX" />
        </div>
        {state.error && <p className="err" role="alert">{state.error}</p>}
        <SubmitButton>שליחת קוד</SubmitButton>
      </form>
    );
  }
  return (
    <form action={action} className="stack" noValidate>
      <span className="steps">רישום מוכר · שלב 1 מתוך 2</span>
      <h2>הקלדת קוד אימות</h2>
      <p className="sub">שלחנו קוד בן 4 ספרות אל <span className="num">{state.phone}</span>.</p>
      {state.devCode && <p className="devcode">סביבת פיתוח: הקוד הוא <b className="num">{state.devCode}</b></p>}
      <div className="field">
        <label htmlFor="code">קוד אימות</label>
        <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={4} autoFocus />
      </div>
      {state.error && <p className="err" role="alert">{state.error}</p>}
      <SubmitButton>אימות</SubmitButton>
      <button className="link-btn" name="resend" value="1" type="submit">שליחת קוד חדש</button>
    </form>
  );
}
