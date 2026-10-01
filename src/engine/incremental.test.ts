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

describe("setSource", () => {
  it("ne recalcule que les champs impactés", () => {
    const engine = new Engine({
      title: "Deux branches",
      fields: [
        source("a", 100),
        source("b", 200),
        computed("depend_de_a", "a * 2"),
        computed("depend_de_b", "b * 2"),
      ],
    });

    expect(engine.setSource("a", 300)).toEqual(["depend_de_a"]);
    expect(engine.evaluations).toBe(1);
    expect(engine.get("depend_de_b")).toBe(400);
  });

  it("propage en cascade dans l'ordre topologique", () => {
    const engine = new Engine(facture);
    expect(engine.setSource("distance", 30)).toEqual(["HT", "montant_TVA", "TTC"]);
    expect(engine.get("TTC")).toBe(8250);
  });

  it("ne touche que le bas de la cascade pour la TVA", () => {
    const engine = new Engine(facture);
    expect(engine.setSource("TVA", 0.2)).toEqual(["montant_TVA", "TTC"]);
    expect(engine.evaluations).toBe(2);
    expect(engine.get("HT")).toBe(5500);
  });

  it("refuse de modifier un champ calculé", () => {
    expect(() => new Engine(facture).setSource("TTC", 1)).toThrow(DocumentError);
  });

  it("refuse un champ inexistant", () => {
    expect(() => new Engine(facture).setSource("inconnu", 1)).toThrow(DocumentError);
  });
});
