import type { Money } from "./types.js";

export function toCents(euros: number): Money {
  return Math.round(euros * 100);
}

export function applyRate(amount: Money, rate: number): Money {
  return roundHalfUp(amount * rate);
}

export function roundHalfUp(value: number): Money {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

export function formatMoney(amount: Money, currency = "EUR", locale = "fr-FR"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount / 100);
}
