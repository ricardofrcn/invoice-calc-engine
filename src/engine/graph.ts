import { assertKnownFields, fieldDependencies } from "./dependencies.js";
import { DocumentError } from "./errors.js";
import type { InvoiceDocument } from "./types.js";

export interface DependencyGraph {
  readonly names: readonly string[];
  readonly dependencies: ReadonlyMap<string, ReadonlySet<string>>;
  readonly dependents: ReadonlyMap<string, ReadonlySet<string>>;
}

export function buildGraph(document: InvoiceDocument): DependencyGraph {
  const names: string[] = [];
  const seen = new Set<string>();

  for (const field of document.fields) {
    if (seen.has(field.name)) {
      throw new DocumentError(`Le champ « ${field.name} » est défini plusieurs fois`, [field.name]);
    }
    seen.add(field.name);
    names.push(field.name);
  }

  assertKnownFields(document);

  const dependencies = new Map<string, Set<string>>();
  const dependents = new Map<string, Set<string>>();
  for (const name of names) {
    dependencies.set(name, new Set());
    dependents.set(name, new Set());
  }

  for (const field of document.fields) {
    for (const dependency of fieldDependencies(field)) {
      dependencies.get(field.name)!.add(dependency);
      dependents.get(dependency)!.add(field.name);
    }
  }

  return { names, dependencies, dependents };
}

export function dependenciesOf(graph: DependencyGraph, name: string): ReadonlySet<string> {
  return graph.dependencies.get(name) ?? new Set();
}

export function dependentsOf(graph: DependencyGraph, name: string): ReadonlySet<string> {
  return graph.dependents.get(name) ?? new Set();
}
