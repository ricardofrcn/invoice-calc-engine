import { describe, expect, it } from "vitest";
import { FormulaError } from "./errors.js";
import { tokenize } from "./lexer.js";

const types = (formula: string) => tokenize(formula).map((t) => t.type);
const values = (formula: string) => tokenize(formula).map((t) => t.value);

describe("tokenize", () => {
  it("découpe une formule simple", () => {
    expect(values("HT * 1.2")).toEqual(["HT", "*", "1.2", ""]);
    expect(types("HT * 1.2")).toEqual(["identifier", "operator", "number", "eof"]);
  });

  it("gère les parenthèses et les espaces multiples", () => {
    expect(values("  HT*(1+TVA)  ")).toEqual(["HT", "*", "(", "1", "+", "TVA", ")", ""]);
  });

  it("accepte les underscores et les chiffres dans les noms de champs", () => {
    expect(values("total_ht_2")).toEqual(["total_ht_2", ""]);
  });

  it("note la position de chaque token", () => {
    const [first, second] = tokenize("HT + TVA");
    expect(first?.position).toBe(0);
    expect(second?.position).toBe(3);
  });
  