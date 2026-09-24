import type { DependencyGraph } from "./graph.js";

type VisitState = "visiting" | "done";

export function findCycle(graph: DependencyGraph): string[] | null {
  const state = new Map<string, VisitState>();
  const stack: string[] = [];

  const visit = (name: string): string[] | null => {
    const current = state.get(name);
    if (current === "done") return null;
    if (current === "visiting") {
      return [...stack.slice(stack.indexOf(name)), name];
    }

    state.set(name, "visiting");
    stack.push(name);

    for (const dependency of graph.dependencies.get(name) ?? []) {
      const found = visit(dependency);
      if (found) return found;
    }

    stack.pop();
    state.set(name, "done");
    return null;
  };

  for (const name of graph.names) {
    const found = visit(name);
    if (found) return found;
  }
  return null;
}

export function formatCycle(cycle: readonly string[]): string {
  return cycle.join(" -> ");
}
