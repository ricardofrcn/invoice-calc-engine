import { Engine } from "../engine/evaluator.js";
import { generateDocument } from "./generate.js";
import { measure, type Measure } from "./measure.js";

const TAILLES = [100, 500, 1000, 2500, 5000];

function mesurer(size: number): [Measure, Measure] {
  const engine = new Engine(generateDocument(size));
  const derniere = `s${size - 1}`;
  return [
    measure("complet", size, () => engine.computeAll()),
    measure("incrémental", size, () => engine.setSource(derniere, 150)),
  ];
}

function ligne(complet: Measure, partiel: Measure): string {
  const gain = complet.ms / partiel.ms;
  return [
    String(complet.size).padStart(6),
    `${complet.ms.toFixed(3)} ms`.padStart(14),
    `${partiel.ms.toFixed(3)} ms`.padStart(14),
    `${gain.toFixed(0)}x`.padStart(8),
  ].join("");
}

console.log("Recalcul complet contre recalcul incrémental\n");
console.log(
  "Champs".padStart(6) + "Complet".padStart(14) + "Incrémental".padStart(14) + "Gain".padStart(8),
);

for (const taille of TAILLES) {
  const [complet, partiel] = mesurer(taille);
  console.log(ligne(complet, partiel));
}
