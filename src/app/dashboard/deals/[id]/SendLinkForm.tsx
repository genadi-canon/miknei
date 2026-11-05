"use client";
import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { sendLinkAction, type SendLinkState } from "../../actions";

export function SendLinkForm({ dealId }: { dealId: string }) {
  const [state, action] = useActionState<SendLinkState, FormData>(sendLinkAction, {});
  return (
    <form key={state.at ?? 0} action={action} className="stack" noValidate>
      <input type="hidden" name="id" value={dealId} />
      <div className="field">
        <label htmlFor="phone">שליחה ב-SMS לנייד של הקונה</label>
        <input id="phone" name="phone" type="tel" inputMode="tel" dir="ltr" placeholder="050-1234567" required defaultValue={state.phone} />
      </div>
      {state.error && <p className="err" role="alert">{state.error}</p>}
      {state.sentTo && <p className="sent" role="status">הקישור נשלח ל-{state.sentTo}.</p>}
      {state.demoText && <p className="fine">בדמו לא נשלח SMS אמיתי. זו ההודעה שהקונה היה מקבל: {state.demoText}</p>}
      <SubmitButton className="btn quiet">שליחת הקישור ב-SMS</SubmitButton>
    </form>
  );
}
