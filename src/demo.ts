import { writeFileSync } from "node:fs";
import { DocumentError } from "./engine/errors.js";
import { Engine } from "./engine/evaluator.js";
import { loadDocument } from "./engine/load.js";
import { formatMoney } from "./engine/money.js";
import { isComputed } from "./engine/types.js";
import { courseVtc, factureCyclique } from "./invoice.js";
import { renderPdf } from "./pdf/invoice.js";
import { renderInvoice } from "./render.js";

const commande = process.argv[2] ?? "facture";

const NON_MONETAIRES = new Set(["distance", "majoration_nuit", "TVA", "heures"]);

function afficherGraphe(engine: Engine): void {
  console.log("\nGraphe de dépendances :");
  for (const field of engine.document.fields) {
    if (!isComputed(field)) continue;
    const deps = [...(engine.graph.dependencies.get(field.name) ?? [])];
    console.log(`  ${field.name.padEnd(18)} <- ${deps.join(", ")}`);
  }
  console.log(`\nOrdre de calcul :\n  ${engine.order.join(" → ")}`);
}

function afficherValeurs(engine: Engine): void {
  console.log("\nValeurs :");
  for (const field of engine.document.fields) {
    const valeur = engine.get(field.name);
    const affichage = NON_MONETAIRES.has(field.name) ? String(valeur) : formatMoney(valeur);
    console.log(`  ${field.name.padEnd(18)} ${affichage.padStart(12)}`);
  }
}

function montrerDocument(engine: Engine, origine?: string): void {
  const suffixe = origine ? `  (chargé depuis ${origine})` : "";
  console.log(`Document : ${engine.document.title}${suffixe}`);
  afficherGraphe(engine);
  afficherValeurs(engine);
}

function demoCycle(): void {
  console.log("Chargement d'une facture volontairement cassée...\n");
  new Engine(factureCyclique);
  console.log("Aucun cycle détecté (ce n'était pas prévu).");
}

function demoSet(): void {
  const [name, raw] = (process.argv[3] ?? "TVA=0.2").split("=");
  const engine = new Engine(courseVtc);
  console.log(`TTC initial : ${formatMoney(engine.get("TTC"))}`);
  console.log(`Calcul complet : ${engine.evaluations} champs évalués\n`);

  const recalcules = engine.setSource(name!, Number(raw));
  console.log(`Modification : ${name} = ${raw}`);
  console.log(`  Recalculés : ${recalcules.join(", ")} (${engine.evaluations} champs)`);
  console.log(`  Nouveau TTC : ${formatMoney(engine.get("TTC"))}`);
}

function demoJson(): void {
  const chemin = process.argv[3] ?? "examples/course-vtc.json";
  montrerDocument(new Engine(loadDocument(chemin)), chemin);
}

function demoFacture(): void {
  const engine = new Engine(courseVtc);
  montrerDocument(engine);
  writeFileSync("facture.html", renderInvoice(engine), "utf8");
  console.log("\nFacture écrite dans facture.html (ouvre-la et fais Ctrl+P pour le PDF).");
}

async function demoPdf(): Promise<void> {
  const engine = new Engine(courseVtc);
  writeFileSync("facture.pdf", await renderPdf(engine));
  console.log(`Facture écrite dans facture.pdf (TTC : ${formatMoney(engine.get("TTC"))}).`);
}

async function main(): Promise<void> {
  if (commande === "cycle") demoCycle();
  else if (commande === "set") demoSet();
  else if (commande === "json") demoJson();
  else if (commande === "pdf") await demoPdf();
  else demoFacture();
}

main().catch((error: unknown) => {
  if (error instanceof DocumentError) {
    console.error(`\nErreur : ${error.message}`);
    process.exit(1);
  }
  throw error;
});
