import { mockProvider } from "./mock";
import type { PaymentProvider } from "./types";

export function getProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER ?? "mock";
  if (name === "mock") {
    // Guard against a real launch silently running on the fake processor.
    if (process.env.NODE_ENV === "production" && process.env.DEMO_MODE !== "1") throw new Error("mock payment provider is only allowed in development or with DEMO_MODE=1");
    return mockProvider;
  }
  // A Rapyd (or other) adapter goes here once there is a signed contract and sandbox keys.
  throw new Error(`payment provider "${name}" is not implemented yet`);
}
export type { PaymentProvider } from "./types";
