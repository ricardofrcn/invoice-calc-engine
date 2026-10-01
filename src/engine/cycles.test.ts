import { describe, expect, it } from "vitest";
import { findCycle, formatCycle } from "./cycles.js";
import { buildGraph } from "./graph.js";
import { computed, source, type InvoiceDocument } from "./types.js";

const cycleDe = (document: InvoiceDocument): string =>
  formatCycle(findCycle(buildGraph(document)) ?? []);

describe("findCycle", () => {
  it("ne trouve rien sur un document sain", () => {
    const document: InvoiceDocument = {
      title: "Sain",
      fields: [source("HT", 100), computed("TTC", "HT * 1.2")],
    };
    expect(findCycle(buildGraph(document))).toBeNull();
  });

  it("accepte un champ utilisé par deux autres", () => {
    const document: InvoiceDocument = {
      title: "Partagé",
      fields: [
        source("HT", 100),
        computed("a", "HT * 2"),
        computed("b", "HT * 3"),
        computed("c", "a + b"),
      ],
    };
    expect(findCycle(buildGraph(document))).toBeNull();
  });

  it("donne le chemin exact d'un cycle à trois champs", () => {
    const document: InvoiceDocument = {
      title: "Cycle",
      fields: [computed("A", "B + 1"), computed("B", "C + 1"), computed("C", "A + 1")],
    };
    expect(cycleDe(document)).toBe("A -> B -> C -> A");
  });

  it("détecte un auto-référencement", () => {
    expect(cycleDe({ title: "Soi", fields: [computed("A", "A + 1")] })).toBe("A -> A");
  });

  it("trouve un cycle isolé du reste du document", () => {
    const document: InvoiceDocument = {
      title: "Deux morceaux",
      fields: [
        source("HT", 100),
        computed("sain", "HT * 2"),
        computed("X", "Y + 1"),
        computed("Y", "X + 1"),
      ],
    };
    expect(cycleDe(document)).toBe("X -> Y -> X");
  });
});
