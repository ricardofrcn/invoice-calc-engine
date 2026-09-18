export type Money = number;

export interface SourceField {
  readonly kind: "source";
  readonly name: string;
  readonly value: number;
}

export interface ComputedField {
  readonly kind: "computed";
  readonly name: string;
  readonly formula: string;
}

export type Field = SourceField | ComputedField;

export interface InvoiceDocument {
  readonly title: string;
  readonly fields: readonly Field[];
}

export function isComputed(field: Field): field is ComputedField {
  return field.kind === "computed";
}

export function source(name: string, value: number): SourceField {
  return { kind: "source", name, value };
}

export function computed(name: string, formula: string): ComputedField {
  return { kind: "computed", name, formula };
}
