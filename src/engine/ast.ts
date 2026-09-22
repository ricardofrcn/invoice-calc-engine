export interface NumberNode {
  readonly type: "number";
  readonly value: number;
}

export interface FieldRefNode {
  readonly type: "field";
  readonly name: string;
  readonly position: number;
}

export type BinaryOperator = "+" | "-" | "*" | "/";

export interface BinaryNode {
  readonly type: "binary";
  readonly operator: BinaryOperator;
  readonly left: AstNode;
  readonly right: AstNode;
}

export interface UnaryNode {
  readonly type: "unary";
  readonly operator: "-";
  readonly operand: AstNode;
}

export type AstNode = NumberNode | FieldRefNode | BinaryNode | UnaryNode;
