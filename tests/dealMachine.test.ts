import { expect, it } from "vitest";
import { nextStatus } from "@/lib/dealMachine";

it("follows the deal lifecycle", () => {
  expect(nextStatus("LINKED", "authorize")).toBe("AUTHORIZED");
  expect(nextStatus("LINKED", "sellerCancel")).toBe("CANCELED");
  expect(nextStatus("AUTHORIZED", "confirm")).toBe("CAPTURED");
  expect(nextStatus("AUTHORIZED", "autoCapture")).toBe("CAPTURED");
  expect(nextStatus("AUTHORIZED", "reject")).toBe("CANCELED");
});

it("blocks illegal moves", () => {
  expect(nextStatus("LINKED", "confirm")).toBeNull();
  expect(nextStatus("AUTHORIZED", "sellerCancel")).toBeNull(); // seller can't cancel after buyer paid
  expect(nextStatus("CAPTURED", "reject")).toBeNull();
  expect(nextStatus("CANCELED", "confirm")).toBeNull();
});
