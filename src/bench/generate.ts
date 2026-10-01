import { computed, source, type Field, type InvoiceDocument } from "../engine/types.js";

export function generateDocument(size: number): InvoiceDocument {
  const fields: Field[] = [];
  for (let i = 0; i < size; i++) {
    fields.push(source(`s${i}`, 100));
    fields.push(computed(`c${i}`, i === 0 ? "s0 * 2" : `c${i - 1} + s${i}`));
  }
  return { title: `Chaîne de ${size} champs calculés`, fields };
}
