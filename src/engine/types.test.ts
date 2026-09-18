import { describe, expect, it } from "vitest";
import { computed, isComputed, source } from "./types.js";

describe("types", () => {
  it("distingue les champs sources des champs calculés", () => {
    expect(isComputed(source("HT", 1000))).toBe(false);
    expect(isComputed(computed("TTC", "HT * 1.2"))).toBe(true);
  });
});
