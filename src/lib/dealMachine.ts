// Pure state machine for a deal. The DB layer applies these transitions inside a conditional update,
// so two concurrent actions (e.g. buyer confirm + auto-capture) cannot both win.
export type DealStatus = "LINKED" | "AUTHORIZED" | "CAPTURED" | "CANCELED";
export type DealAction =
  | "authorize" // buyer's card got a J5 authorization (no charge)
  | "confirm" // buyer confirmed receipt -> capture
  | "reject" // buyer reported not received -> void authorization
  | "autoCapture" // hold window elapsed with no answer
  | "sellerCancel"; // seller withdrew the link before payment

const table: Record<DealStatus, Partial<Record<DealAction, DealStatus>>> = {
  LINKED: { authorize: "AUTHORIZED", sellerCancel: "CANCELED" },
  AUTHORIZED: { confirm: "CAPTURED", reject: "CANCELED", autoCapture: "CAPTURED" },
  CAPTURED: {},
  CANCELED: {},
};

export function nextStatus(from: DealStatus, action: DealAction): DealStatus | null {
  return table[from][action] ?? null;
}

/** Buyer has this long to confirm or reject before the card is charged automatically. */
export const HOLD_HOURS = 48;
