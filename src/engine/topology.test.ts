import { describe, expect, it } from "vitest";
import { buildGraph, type DependencyGraph } from "./graph.js";
import { topologicalOrder } from "./topology.js";
import { computed, source, type Field, type InvoiceDocument } from "./types.js";

function ordreValide(graph: DependencyGraph, order: readonly string[]): boolean {
  const rang = new Map(order.map((name, index) => [name, index]));
  return order.every((name) =>
    [...(graph.dependencies.get(name) ?? [])].every((dep) => rang.get(dep)! < rang.get(name)!),
  );
}

describe("topologicalOrder", () => {
  it("place chaque champ après ses dépendances", () => {
    const fields: Field[] = [
      source("a", 1),
      source("b", 2),
      computed("c", "a + b"),
      computed("d", "c * 2"),
      computed("e", "d + a"),
      computed("f", "e - c"),
      computed("g", "f + d"),
      computed("h", "g * b"),
      computed("i", "h + g"),
      computed("j", "i - f"),
    ];
    const graph = buildGraph({ title: "Chaîne", fields });
    const order = topologicalOrder(graph);

    expect(order).toHaveLength(fields.length);
    expect(ordreValide(graph, order)).toBe(true);
  });

  it("commence par les champs sources", () => {
    const document: InvoiceDocument = {
      title: "Sources",
      fields: [computed("TTC", "HT * 1.2"), source("HT", 100)],
    };
    expect(topologicalOrder(buildGraph(document))[0]).toBe("HT");
  });

  it("accepte un document sans aucune formule", () => {
    const document: InvoiceDocument = {
      title: "Plat",
      fields: [source("a", 1), source("b", 2)],
    };
    expect(topologicalOrder(buildGraph(document))).toHaveLength(2);
  });

  it("refuse un document cyclique en nommant le cycle", () => {
    const document: InvoiceDocument = {
      title: "Cycle",
      fields: [computed("A", "B + 1"), computed("B", "A + 1")],
    };
    expect(() => topologicalOrder(buildGraph(document))).toThrow(/A -> B -> A/);
  });
});
