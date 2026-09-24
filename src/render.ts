import { formatMoney } from "./engine/money.js";
import type { Engine } from "./engine/evaluator.js";
import { isComputed } from "./engine/types.js";

const LIGNES_AFFICHEES = [
  "base_HT",
  "majoration",
  "frais_reservation",
  "remise",
  "HT",
  "montant_TVA",
  "TTC",
];

const LIBELLES: Record<string, string> = {
  base_HT: "Course",
  majoration: "Majoration de nuit",
  frais_reservation: "Frais de réservation",
  remise: "Remise",
  HT: "Total HT",
  montant_TVA: "TVA",
  TTC: "Total TTC",
};

export function renderInvoice(engine: Engine): string {
  const date = new Date().toLocaleDateString("fr-FR");

  const lignes = LIGNES_AFFICHEES.map((name) => {
    const montant = engine.get(name);
    const signe = name === "remise" ? -montant : montant;
    const total = name === "HT" || name === "TTC";
    return `<tr class="${total ? "total" : ""}">
        <td>${LIBELLES[name] ?? name}</td>
        <td class="montant">${formatMoney(signe)}</td>
      </tr>`;
  }).join("\n      ");

  const formules = engine.document.fields
    .filter(isComputed)
    .map((field) => `<li><code>${field.name} = ${field.formula}</code></li>`)
    .join("\n      ");

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${engine.document.title}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 3rem auto; max-width: 40rem; color: #111; }
    h1 { font-size: 1.4rem; margin-bottom: 0.2rem; }
    .meta { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 0.6rem 0; border-bottom: 1px solid #eee; }
    .montant { text-align: right; font-variant-numeric: tabular-nums; }
    .total td { font-weight: 600; border-top: 2px solid #111; border-bottom: none; }
    .annexe { margin-top: 3rem; font-size: 0.85rem; color: #555; }
    code { background: #f5f5f5; padding: 0.1rem 0.3rem; border-radius: 3px; }
    @media print { .annexe { display: none; } }
  </style>
</head>
<body>
  <h1>${engine.document.title}</h1>
  <p class="meta">Facture générée le ${date} · ordre de calcul : ${engine.order.join(" → ")}</p>
  <table>
      ${lignes}
  </table>
  <div class="annexe">
    <p>Champs calculés par le moteur :</p>
    <ul>
      ${formules}
    </ul>
  </div>
</body>
</html>`;
}
