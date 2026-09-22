import type { AstNode } from "./ast.js";
import { DocumentError } from "./errors.js";
import { parse } from "./parser.js";
import { isComputed, type Field, type InvoiceDocument } from "./types.js";

export function collectDependencies(node: AstNode, found: Set<string> = new Set()): Set<string> {
  switch (node.type) {
    case "number":
      break;
    case "field":
      found.add(node.name);
      break;
    case "unary":
      collectDependencies(node.operand, found);
      break;
    case "binary":
      collectDependencies(node.left, found);
      collectDependencies(node.right, found);
      break;
  }
  return found;
}

export function fieldDependencies(field: Field): Set<string> {
  return isComputed(field) ? collectDependencies(parse(field.formula)) : new Set();
}

export function assertKnownFields(document: InvoiceDocument): void {
  const known = new Set(document.fields.map((field) => field.name));
  const unknown: string[] = [];

  for (const field of document.fields) {
    for (const dependency of fieldDependencies(field)) {
      if (!known.has(dependency)) {
        unknown.push(`${field.name} référence « ${dependency} » qui n'existe pas`);
      }
    }
  }

  if (unknown.length > 0) {
    throw new DocumentError(`Références inconnues :\n  ${unknown.join("\n  ")}`, unknown);
  }
}
