import type { AstNode } from "./ast.js";
import { DocumentError } from "./errors.js";
import { buildGraph, type DependencyGraph } from "./graph.js";
import { roundHalfUp } from "./money.js";
import { parse } from "./parser.js";
import { topologicalOrder } from "./topology.js";
import { isComputed, type InvoiceDocument } from "./types.js";


export class Engine {
  readonly graph: DependencyGraph;
  readonly order: readonly string[];

  private readonly asts = new Map<string, AstNode>();
  private readonly values = new Map<string, number>();

  evaluations = 0;

  constructor(readonly document: InvoiceDocument) {
    this.graph = buildGraph(document);
    this.order = topologicalOrder(this.graph);

    for (const field of document.fields) {
      if (isComputed(field)) {
        this.asts.set(field.name, parse(field.formula));
      } else {
        this.values.set(field.name, field.value);
      }
    }

    this.computeAll();
  }

  computeAll(): void {
    this.evaluations = 0;
    for (const name of this.order) {
      if (this.asts.has(name)) this.compute(name);
    }
  }

  get(name: string): number {
    const value = this.values.get(name);
    if (value === undefined) {
      throw new DocumentError(`Le champ « ${name} » n'existe pas`, [name]);
    }
    return value;
  }

  snapshot(): Map<string, number> {
    return new Map(this.values);
  }

  private compute(name: string): void {
    const ast = this.asts.get(name)!;
    this.values.set(name, roundHalfUp(this.evaluate(ast, name)));
    this.evaluations++;
  }

  private evaluate(node: AstNode, field: string): number {
    switch (node.type) {
      case "number":
        return node.value;
      case "field": {
        const value = this.values.get(node.name);
        if (value === undefined) {
          throw new DocumentError(
            `« ${field} » utilise « ${node.name} » qui n'est pas encore calculé`,
            [field, node.name],
          );
        }
        return value;
      }
      case "unary":
        return -this.evaluate(node.operand, field);
      case "binary": {
        const left = this.evaluate(node.left, field);
        const right = this.evaluate(node.right, field);
        switch (node.operator) {
          case "+":
            return left + right;
          case "-":
            return left - right;
          case "*":
            return left * right;
          case "/":
            if (right === 0) {
              throw new DocumentError(`Division par zéro dans « ${field} »`, [field]);
            }
            return left / right;
        }
      }
    }
  }
}
