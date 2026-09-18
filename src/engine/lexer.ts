import { FormulaError } from "./errors.js";

export type TokenType = "number" | "identifier" | "operator" | "lparen" | "rparen" | "eof";

export interface Token {
  readonly type: TokenType;
  readonly value: string;
  readonly position: number;
}

const OPERATORS = new Set(["+", "-", "*", "/"]);

const isDigit = (c: string | undefined): boolean => c !== undefined && c >= "0" && c <= "9";
const isIdentStart = (c: string | undefined): boolean => c !== undefined && /[A-Za-z_]/.test(c);
const isIdentPart = (c: string | undefined): boolean => c !== undefined && /[A-Za-z0-9_]/.test(c);

export function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < formula.length) {
    const char = formula[i]!;

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (isDigit(char)) {
      const start = i;
      while (isDigit(formula[i])) i++;
      if (formula[i] === ".") {
        i++;
        if (!isDigit(formula[i])) {
          throw new FormulaError("Décimale incomplète après le point", i, formula);
        }
        while (isDigit(formula[i])) i++;
      }
      tokens.push({ type: "number", value: formula.slice(start, i), position: start });
      continue;
    }

    if (isIdentStart(char)) {
      const start = i;
      while (isIdentPart(formula[i])) i++;
      tokens.push({ type: "identifier", value: formula.slice(start, i), position: start });
      continue;
    }

    if (OPERATORS.has(char)) {
      tokens.push({ type: "operator", value: char, position: i });
      i++;
      continue;
    }

    if (char === "(" || char === ")") {
      tokens.push({ type: char === "(" ? "lparen" : "rparen", value: char, position: i });
      i++;
      continue;
    }

    throw new FormulaError(`Caractère invalide « ${char} »`, i, formula);
  }

  tokens.push({ type: "eof", value: "", position: formula.length });
  return tokens;
}
