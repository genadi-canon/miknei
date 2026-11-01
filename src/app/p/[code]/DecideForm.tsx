"use client";
import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { decideAction, type ConfirmState } from "./actions";

export function DecideForm({ code }: { code: string }) {
  const [state, action] = useActionState<ConfirmState, FormData>(decideAction.bind(null, code), {});
  return (
    <div className="stack">
      <form action={action}><input type="hidden" name="decision" value="confirm" /><SubmitButton>קיבלתי, הכול תקין</SubmitButton></form>
      <form action={action}><input type="hidden" name="decision" value="reject" /><SubmitButton className="btn ghost">לא קיבלתי את המוצר</SubmitButton></form>
      {state.error && <p className="err" role="alert">{state.error}</p>}
    </div>
  );
}
