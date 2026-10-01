import { describe, expect, it } from "vitest";
import { DocumentError } from "./errors.js";
import { buildGraph, dependenciesOf, dependentsOf } from "./graph.js";
import { computed, source, type InvoiceDocument } from "./types.js";

const facture: InvoiceDocument = {
  title: "Test",
  fields: [
    source("HT", 5000),
    source("TVA", 0.1),
    computed("montant_TVA", "HT * TVA"),
    computed("TTC", "HT + montant_TVA"),
  ],
};

describe("buildGraph", () => {
  it("construit le sens « je dépends de »", () => {
    const graph = buildGraph(facture);
    expect([...dependenciesOf(graph, "montant_TVA")].sort()).toEqual(["HT", "TVA"]);
    expect(dependenciesOf(graph, "HT").size).toBe(0);
  });

  it("construit le sens inverse « dépend de moi »", () => {
    const graph = buildGraph(facture);
    expect([...dependentsOf(graph, "HT")].sort()).toEqual(["TTC", "montant_TVA"]);
    expect(dependentsOf(graph, "TTC").size).toBe(0);
  });

  it("garde l'ordre de déclaration des champs", () => {
    expect(buildGraph(facture).names).toEqual(["HT", "TVA", "montant_TVA", "TTC"]);
  });

  it("refuse un champ défini deux fois", () => {
    const document: InvoiceDocument = {
      title: "Doublon",
      fields: [source("HT", 1), source("HT", 2)],
    };
    expect(() => buildGraph(document)).toThrow(DocumentError);
  });

  it("refuse une formule qui référence un champ inexistant", () => {
    const document: InvoiceDocument = {
      title: "Cassé",
      fields: [source("HT", 1), computed("TTC", "HT * remise")],
    };
    expect(() => buildGraph(document)).toThrow(/remise/);
  });
});
