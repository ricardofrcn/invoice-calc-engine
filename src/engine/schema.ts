import { DocumentError } from "./errors.js";
import { computed, source, type Field, type InvoiceDocument } from "./types.js";

type Raw = Record<string, unknown>;

function asObject(value: unknown, where: string): Raw {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new DocumentError(`${where} doit être un objet`);
  }
  return value as Raw;
}

function asString(value: unknown, where: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new DocumentError(`${where} doit être une chaîne non vide`);
  }
  return value;
}

function asNumber(value: unknown, where: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new DocumentError(`${where} doit être un nombre fini`);
  }
  return value;
}

function parseField(raw: unknown, index: number): Field {
  const where = `fields[${index}]`;
  const object = asObject(raw, where);
  const name = asString(object.name, `${where}.name`);

  if (object.formula !== undefined) {
    return computed(name, asString(object.formula, `${where}.formula`));
  }
  if (object.value !== undefined) {
    return source(name, asNumber(object.value, `${where}.value`));
  }
  throw new DocumentError(`${where} doit avoir « value » ou « formula »`);
}

export function parseDocument(raw: unknown): InvoiceDocument {
  const object = asObject(raw, "Le document");
  if (!Array.isArray(object.fields)) {
    throw new DocumentError("« fields » doit être un tableau");
  }
  return {
    title: asString(object.title, "title"),
    fields: object.fields.map(parseField),
  };
}
