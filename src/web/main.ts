import { Engine } from "../engine/evaluator.js";
import { DocumentError } from "../engine/errors.js";
import { parseDocument } from "../engine/schema.js";
import { isComputed } from "../engine/types.js";
import { renderPdf } from "../pdf/invoice.js";
import { majValeurs, renderComputed, renderSources } from "./fields.js";

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const choix = $<HTMLSelectElement>("document-choice");
const boutonPdf = $<HTMLButtonElement>("export-pdf");
const sources = $("sources");
const computed = $("computed");
const erreur = $("error");
const statut = $("status");

let engine: Engine | null = null;

function afficherErreur(error: unknown): void {
  erreur.hidden = error === null;
  erreur.textContent =
    error === null ? "" : error instanceof DocumentError ? error.message : String(error);
}

function onSaisie(event: Event): void {
  const input = event.target as HTMLInputElement;
  const name = input.closest<HTMLElement>("[data-field]")?.dataset.field;
  if (!engine || !name || input.value === "") return;

  try {
    const recalcules = engine.setSource(name, Number(input.value));
    majValeurs(engine, computed, recalcules);
    const total = engine.document.fields.filter(isComputed).length;
    statut.textContent = `${recalcules.length} champ(s) recalcule(s) sur ${total}.`;
    afficherErreur(null);
  } catch (error) {
    afficherErreur(error);
  }
}

async function telechargerPdf(): Promise<void> {
  if (!engine) return;
  const octets = new Uint8Array(await renderPdf(engine));
  const blob = new Blob([octets.buffer], { type: "application/pdf" });
  const lien = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: "facture.pdf",
  });
  lien.click();
  URL.revokeObjectURL(lien.href);
}

async function charger(fichier: string): Promise<void> {
  statut.textContent = "Modifiez une valeur pour voir le recalcul.";
  try {
    const reponse = await fetch(fichier);
    engine = new Engine(parseDocument(await reponse.json()));
    renderSources(engine, sources);
    renderComputed(engine, computed);
    afficherErreur(null);
  } catch (error) {
    engine = null;
    sources.replaceChildren();
    computed.replaceChildren();
    afficherErreur(error);
  }
  boutonPdf.disabled = engine === null;
}

sources.addEventListener("input", onSaisie);
choix.addEventListener("change", () => void charger(choix.value));
boutonPdf.addEventListener("click", () => void telechargerPdf());
void charger(choix.value);
