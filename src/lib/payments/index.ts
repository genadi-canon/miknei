import { mockProvider } from "./mock";
import type { PaymentProvider } from "./types";

export function getProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER ?? "mock";
  if (name === "mock") return mockProvider;
  // A Rapyd (or other) adapter goes here once there is a signed contract and sandbox keys.
  throw new Error(`payment provider "${name}" is not implemented yet`);
}
export type { PaymentProvider } from "./types";
