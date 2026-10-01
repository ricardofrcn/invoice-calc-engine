import { describe, expect, it } from "vitest";
import { DocumentError } from "./errors.js";
import { parseDocument } from "./schema.js";

const valide = {
  title: "Facture",
  fields: [
    { name: "HT", value: 1000 },
    { name: "TTC", formula: "HT * 1.2" },
  ],
};

describe("parseDocument", () => {
  it("convertit un document correct", () => {
    const document = parseDocument(valide);
    expect(document.title).toBe("Facture");
    expect(document.fields).toHaveLength(2);
    expect(document.fields[1]).toEqual({ kind: "computed", name: "TTC", formula: "HT * 1.2" });
  });

  it("refuse un titre manquant", () => {
    expect(() => parseDocument({ fields: [] })).toThrow(/title/);
  });

  it("refuse un champ sans value ni formula", () => {
    expect(() => parseDocument({ title: "X", fields: [{ name: "a" }] })).toThrow(/fields\[0\]/);
  });

  it("refuse une valeur non numérique", () => {
    const raw = { title: "X", fields: [{ name: "a", value: "cent" }] };
    expect(() => parseDocument(raw)).toThrow(DocumentError);
  });

  it("refuse un fields qui n'est pas un tableau", () => {
    expect(() => parseDocument({ title: "X", fields: {} })).toThrow(/tableau/);
  });
});
