import { describe, it, expect } from "vitest";
import { creditsGrantedFor } from "../pricing";

describe("creditsGrantedFor — credits require a PAID payment", () => {
  it("grants the credits for a paid payment", () => {
    expect(creditsGrantedFor("paid", 8)).toBe(8);
  });
  it("grants nothing for a pending (initiated) payment", () => {
    expect(creditsGrantedFor("initiated", 8)).toBe(0);
  });
  it("grants nothing for failed or refunded payments", () => {
    expect(creditsGrantedFor("failed", 8)).toBe(0);
    expect(creditsGrantedFor("refunded", 8)).toBe(0);
  });
  it("never grants negative or fractional credits", () => {
    expect(creditsGrantedFor("paid", -3)).toBe(0);
    expect(creditsGrantedFor("paid", 2.9)).toBe(2);
    expect(creditsGrantedFor("paid", 0)).toBe(0);
  });
});
