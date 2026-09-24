import { findCycle, formatCycle } from "./cycles.js";
import { DocumentError } from "./errors.js";
import type { DependencyGraph } from "./graph.js";

export function topologicalOrder(graph: DependencyGraph): string[] {
  const remaining = new Map<string, number>();
  const queue: string[] = [];

  for (const name of graph.names) {
    const count = graph.dependencies.get(name)?.size ?? 0;
    remaining.set(name, count);
    if (count === 0) queue.push(name);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const name = queue.shift()!;
    order.push(name);

    for (const dependent of graph.dependents.get(name) ?? []) {
      const left = (remaining.get(dependent) ?? 0) - 1;
      remaining.set(dependent, left);
      if (left === 0) queue.push(dependent);
    }
  }

  if (order.length !== graph.names.length) {
    const cycle = findCycle(graph);
    throw new DocumentError(
      `Cycle de dépendances : ${cycle ? formatCycle(cycle) : "non localisé"}`,
      cycle ?? [],
    );
  }

  return order;
}
