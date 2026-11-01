export interface SmsSender { send(phone: string, text: string): Promise<void> }

const mockSms: SmsSender = {
  async send(phone, text) {
    console.log(`[sms:mock] to ${phone}: ${text}`);
  },
};

export function getSms(): SmsSender {
  const name = process.env.SMS_PROVIDER ?? "mock";
  if (name === "mock") return mockSms;
  throw new Error(`sms provider "${name}" is not implemented yet`);
}

/** Show OTP codes on screen only with the mock sender outside production. */
export const showDevCodes = () => (process.env.SMS_PROVIDER ?? "mock") === "mock" && process.env.NODE_ENV !== "production";
