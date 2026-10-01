import { describe, expect, it } from "vitest";
import { DocumentError } from "./errors.js";
import { Engine } from "./evaluator.js";
import { computed, source, type InvoiceDocument } from "./types.js";

const facture: InvoiceDocument = {
  title: "Course",
  fields: [
    source("prix_km", 250),
    source("distance", 22),
    source("TVA", 0.1),
    computed("HT", "prix_km * distance"),
    computed("montant_TVA", "HT * TVA"),
    computed("TTC", "HT + montant_TVA"),
  ],
};

describe("Engine", () => {
  it("calcule une cascade complète", () => {
    const engine = new Engine(facture);
    expect(engine.get("HT")).toBe(5500);
    expect(engine.get("montant_TVA")).toBe(550);
    expect(engine.get("TTC")).toBe(6050);
  });

  it("arrondit chaque champ calculé au centime", () => {
    const engine = new Engine({
      title: "Arrondi",
      fields: [source("HT", 1999), source("TVA", 0.2), computed("TVA_due", "HT * TVA")],
    });
    expect(engine.get("TVA_due")).toBe(400);
  });

  it("gère le moins unaire et les parenthèses", () => {
    const engine = new Engine({
      title: "Signes",
      fields: [source("a", 100), computed("b", "-a + 300"), computed("c", "(b + a) * 2")],
    });
    expect(engine.get("b")).toBe(200);
    expect(engine.get("c")).toBe(600);
  });

  it("refuse une division par zéro en nommant le champ", () => {
    const document: InvoiceDocument = {
      title: "Zéro",
      fields: [source("a", 10), source("b", 0), computed("c", "a / b")],
    };
    expect(() => new Engine(document)).toThrow(/c/);
  });

  it("refuse un document cyclique dès la construction", () => {
    const document: InvoiceDocument = {
      title: "Cycle",
      fields: [computed("A", "B + 1"), computed("B", "A + 1")],
    };
    expect(() => new Engine(document)).toThrow(/A -> B -> A/);
  });

  it("refuse la lecture d'un champ inexistant", () => {
    expect(() => new Engine(facture).get("inconnu")).toThrow(DocumentError);
  });
});
