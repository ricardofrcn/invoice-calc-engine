import type { Engine } from "../engine/evaluator.js";
import { formatMoney } from "../engine/money.js";
import { isComputed, type Field } from "../engine/types.js";

const NON_MONETAIRES = /^(distance|heures|TVA|.*_nuit)$/;

const DUREE_SURLIGNAGE = 900;

export function formatValeur(field: Field, valeur: number): string {
  return NON_MONETAIRES.test(field.name) ? String(valeur) : formatMoney(valeur);
}

function ligne(nom: string, contenu: string): HTMLElement {
  const element = document.createElement("div");
  element.className = "ligne";
  element.dataset.field = nom;
  element.innerHTML = contenu;
  return element;
}

export function renderSources(engine: Engine, cible: HTMLElement): void {
  cible.replaceChildren();
  for (const field of engine.document.fields) {
    if (isComputed(field)) continue;
    const valeur = engine.get(field.name);
    cible.append(
      ligne(
        field.name,
        `<label>${field.name}</label>
         <input type="number" step="any" value="${valeur}" />`,
      ),
    );
  }
}

export function renderComputed(engine: Engine, cible: HTMLElement): void {
  cible.replaceChildren();
  for (const field of engine.document.fields) {
    if (!isComputed(field)) continue;
    cible.append(
      ligne(
        field.name,
        `<label title="${field.name} = ${field.formula}">${field.name}</label>
         <span class="valeur">${formatValeur(field, engine.get(field.name))}</span>`,
      ),
    );
  }
}

function surligner(element: HTMLElement): void {
  element.classList.add("recalcule");
  setTimeout(() => element.classList.remove("recalcule"), DUREE_SURLIGNAGE);
}

export function majValeurs(
  engine: Engine,
  cible: HTMLElement,
  recalcules: readonly string[],
): void {
  for (const field of engine.document.fields) {
    if (!isComputed(field)) continue;
    const element = cible.querySelector<HTMLElement>(`[data-field="${field.name}"]`);
    const span = element?.querySelector(".valeur");
    if (!element || !span) continue;

    span.textContent = formatValeur(field, engine.get(field.name));
    if (recalcules.includes(field.name)) surligner(element);
  }
}
