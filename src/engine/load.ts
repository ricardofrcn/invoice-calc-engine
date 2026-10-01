import { readFileSync } from "node:fs";
import { DocumentError } from "./errors.js";
import { parseDocument } from "./schema.js";
import type { InvoiceDocument } from "./types.js";

/** Lit un document depuis un fichier JSON et le valide. */
export function loadDocument(path: string): InvoiceDocument {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    throw new DocumentError(`Fichier introuvable ou illisible : ${path}`);
  }

  try {
    return parseDocument(JSON.parse(text));
  } catch (error) {
    if (error instanceof DocumentError) throw error;
    throw new DocumentError(`JSON invalide dans ${path} : ${(error as Error).message}`);
  }
}
