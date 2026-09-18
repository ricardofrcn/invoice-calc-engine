import { describe, expect, it } from "vitest";
import { applyRate, formatMoney, roundHalfUp, toCents } from "./money.js";

describe("money", () => {
  it("évite les erreurs de flottants", () => {
    expect(toCents(0.1) + toCents(0.2)).toBe(toCents(0.3));
  });

  it("applique un taux de TVA au centime", () => {
    expect(applyRate(1999, 0.2)).toBe(400);
  });

  it("arrondit 0,5 en s'éloignant de zéro", () => {
    expect(roundHalfUp(2.5)).toBe(3);
    expect(roundHalfUp(-2.5)).toBe(-3);
  });

  it("formate un montant en euros", () => {
    expect(formatMoney(123456)).toContain("1");
  });
});
