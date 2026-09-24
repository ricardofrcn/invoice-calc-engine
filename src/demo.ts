import { writeFileSync } from "node:fs";
import { DocumentError } from "./engine/errors.js";
import { Engine } from "./engine/evaluator.js";
import { formatMoney } from "./engine/money.js";
import { isComputed } from "./engine/types.js";
import { courseVtc, factureCyclique } from "./invoice.js";
import { renderInvoice } from "./render.js";

const commande = process.argv[2] ?? "facture";

function afficherGraphe(engine: Engine): void {
  console.log("\nGraphe de dépendances :");
  for (const field of engine.document.fields) {
    if (!isComputed(field)) continue;
    const deps = [...(engine.graph.dependencies.get(field.name) ?? [])];
    console.log(`  ${field.name.padEnd(18)} <- ${deps.join(", ")}`);
  }
  console.log(`\nOrdre de calcul :\n  ${engine.order.join(" → ")}`);
}

const NON_MONETAIRES = new Set(["distance", "majoration_nuit", "TVA"]);

function afficherValeurs(engine: Engine): void {
  console.log("\nValeurs :");
  for (const field of engine.document.fields) {
    const valeur = engine.get(field.name);
    const affichage = NON_MONETAIRES.has(field.name) ? String(valeur) : formatMoney(valeur);
    console.log(`  ${field.name.padEnd(18)} ${affichage.padStart(12)}`);
  }
}

try {
  if (commande === "cycle") {
    console.log("Chargement d'une facture volontairement cassée...\n");
    new Engine(factureCyclique);
    console.log("Aucun cycle détecté (ce n'était pas prévu).");
  } else if (commande === "set") {
    const [name, raw] = (process.argv[3] ?? "distance=30").split("=");
    const engine = new Engine(courseVtc);
    console.log(`TTC initial : ${formatMoney(engine.get("TTC"))}`);
    console.log(`Calcul complet : ${engine.evaluations} champs évalués\n`);

    const recalcules = engine.setSource(name!, Number(raw));
    console.log(`Modification : ${name} = ${raw}`);
    console.log(`  Recalculés : ${recalcules.join(", ")} (${engine.evaluations} champs)`);
    console.log(`  Nouveau TTC : ${formatMoney(engine.get("TTC"))}`);
  } else {
    const engine = new Engine(courseVtc);
    console.log(`Document : ${engine.document.title}`);
    afficherGraphe(engine);
    afficherValeurs(engine);

    writeFileSync("facture.html", renderInvoice(engine), "utf8");
    console.log("\nFacture écrite dans facture.html (ouvre-la et fais Ctrl+P pour le PDF).");
  }
} catch (error) {
  if (error instanceof DocumentError) {
    console.error(`\nErreur : ${error.message}`);
    process.exit(1);
  }
  throw error;
}
