import type { AstNode } from "./engine/ast.js";
import { collectDependencies } from "./engine/dependencies.js";
import { FormulaError } from "./engine/errors.js";
import { tokenize } from "./engine/lexer.js";
import { parse } from "./engine/parser.js";

function printTree(node: AstNode, indent = ""): void {
  switch (node.type) {
    case "number":
      console.log(`${indent}${node.value}`);
      break;
    case "field":
      console.log(`${indent}[${node.name}]`);
      break;
    case "unary":
      console.log(`${indent}${node.operator} (négation)`);
      printTree(node.operand, indent + "  ");
      break;
    case "binary":
      console.log(`${indent}${node.operator}`);
      printTree(node.left, indent + "  ");
      printTree(node.right, indent + "  ");
      break;
  }
}

const formula = process.argv[2] ?? "HT * (1 + TVA) - remise";

try {
  console.log(`Formule : ${formula}\n`);

  const tokens = tokenize(formula).filter((t) => t.type !== "eof");
  console.log("Tokens :");
  console.log("  " + tokens.map((t) => `${t.type}(${t.value})`).join("  "));

  console.log("\nArbre syntaxique :");
  printTree(parse(formula), "  ");

  const deps = [...collectDependencies(parse(formula))];
  console.log(`\nDépendances : ${deps.length > 0 ? deps.join(", ") : "aucune"}`);
} catch (error) {
  if (error instanceof FormulaError) {
    console.error(`Erreur de formule : ${error.format()}`);
    process.exit(1);
  }
  throw error;
}
