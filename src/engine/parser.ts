import type { AstNode, BinaryOperator } from "./ast.js";
import { FormulaError } from "./errors.js";
import { tokenize, type Token } from "./lexer.js";

export function parse(formula: string): AstNode {
  const tokens = tokenize(formula);
  let index = 0;

  const peek = (): Token => tokens[index]!;

  const eat = (value: string): boolean => {
    if (peek().value === value && peek().type !== "eof") {
      index++;
      return true;
    }
    return false;
  };

  const parseExpression = (): AstNode => {
    let left = parseTerm();
    for (;;) {
      const operator = peek().value;
      if ((operator === "+" || operator === "-") && eat(operator)) {
        left = { type: "binary", operator: operator as BinaryOperator, left, right: parseTerm() };
      } else {
        return left;
      }
    }
  };

  const parseTerm = (): AstNode => {
    let left = parseUnary();
    for (;;) {
      const operator = peek().value;
      if ((operator === "*" || operator === "/") && eat(operator)) {
        left = { type: "binary", operator: operator as BinaryOperator, left, right: parseUnary() };
      } else {
        return left;
      }
    }
  };

  const parseUnary = (): AstNode => {
    if (peek().type === "operator" && peek().value === "-") {
      index++;
      return { type: "unary", operator: "-", operand: parseUnary() };
    }
    return parsePrimary();
  };

  const parsePrimary = (): AstNode => {
    const token = peek();

    if (token.type === "number") {
      index++;
      return { type: "number", value: Number(token.value) };
    }

    if (token.type === "identifier") {
      index++;
      return { type: "field", name: token.value, position: token.position };
    }

    if (token.type === "lparen") {
      index++;
      const inner = parseExpression();
      if (peek().type !== "rparen") {
        throw new FormulaError("Parenthèse fermante manquante", peek().position, formula);
      }
      index++;
      return inner;
    }

    const what = token.type === "eof" ? "Fin de formule inattendue" : `Jeton inattendu « ${token.value} »`;
    throw new FormulaError(what, token.position, formula);
  };

  const root = parseExpression();
  if (peek().type !== "eof") {
    throw new FormulaError(`Jeton inattendu « ${peek().value} »`, peek().position, formula);
  }
  return root;
}
