export interface SmsSender { send(phone: string, text: string): Promise<void> }

const mockSms: SmsSender = {
  async send(phone, text) {
    console.log(`[sms:mock] to ${phone}: ${text}`);
  },
};

export function getSms(): SmsSender {
  const name = process.env.SMS_PROVIDER ?? "mock";
  if (name === "mock") {
    if (process.env.NODE_ENV === "production" && !isDemo()) throw new Error("mock SMS is only allowed in development or with DEMO_MODE=1");
    return mockSms;
  }
  throw new Error(`sms provider "${name}" is not implemented yet`);
}

export const isDemo = () => process.env.DEMO_MODE === "1";

/** Show OTP codes on screen only with the mock sender, in development or in a demo deployment. */
export const showDevCodes = () => (process.env.SMS_PROVIDER ?? "mock") === "mock" && (process.env.NODE_ENV !== "production" || isDemo());
