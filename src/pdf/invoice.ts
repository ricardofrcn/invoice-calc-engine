/**
 * Rendu PDF d'une facture deja calculee. Ce module ne fait aucun calcul et
 * n'ecrit aucun fichier : il renvoie les octets du PDF, ce qui le rend
 * utilisable tel quel en ligne de commande comme dans le navigateur.
 * Il parcourt les champs calcules du document, donc il marche sur n'importe
 * quel modele sans liste de lignes codee en dur.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Engine } from "../engine/evaluator.js";
import { formatMoney } from "../engine/money.js";
import { isComputed } from "../engine/types.js";

const LARGEUR_PAGE = 595;
const HAUTEUR_PAGE = 842;
const MARGE = 64;
const UTILE = LARGEUR_PAGE - MARGE * 2;
const INTERLIGNE = 26;

const ENCRE = rgb(0.08, 0.09, 0.11);
const SOURDINE = rgb(0.45, 0.47, 0.5);
const TRAIT = rgb(0.87, 0.88, 0.9);
const BANDE = rgb(0.955, 0.96, 0.97);

/** Champs mis en avant comme totaux. */
const TOTAUX = new Set(["HT", "TTC"]);

const LIBELLES: Record<string, string> = {
  base_HT: "Course",
  majoration: "Majoration de nuit",
  main_oeuvre: "Main d'oeuvre",
  HT: "Total HT",
  montant_TVA: "TVA",
  TTC: "Total TTC",
};

type Style = { font: PDFFont; size: number; color: ReturnType<typeof rgb> };

/** Les polices standard d'un PDF ne portent pas les accents : on les retire. */
const sansAccent = (t: string): string => t.normalize("NFD").replace(/[̀-ͯ]/g, "");

const libelle = (name: string): string => LIBELLES[name] ?? name.replaceAll("_", " ");

/** Faux interlettrage, faute de reglage natif dans pdf-lib. */
const espacer = (t: string): string => t.split("").join(" ");

/** Ecrit un texte cale a gauche sur la marge, ou a droite sur le bord oppose. */
function texte(page: PDFPage, contenu: string, y: number, style: Style, aDroite = false): void {
  const propre = sansAccent(contenu);
  const decalage = aDroite ? UTILE - style.font.widthOfTextAtSize(propre, style.size) : 0;
  page.drawText(propre, { x: MARGE + decalage, y, ...style });
}

function regle(page: PDFPage, y: number, epaisseur = 0.5, color = TRAIT): void {
  const bords = { start: { x: MARGE, y }, end: { x: MARGE + UTILE, y } };
  page.drawLine({ ...bords, thickness: epaisseur, color });
}

function entete(page: PDFPage, regular: PDFFont, bold: PDFFont, titre: string): number {
  let y = HAUTEUR_PAGE - MARGE;
  page.drawRectangle({ x: MARGE, y, width: 34, height: 2.5, color: ENCRE });

  y -= 32;
  texte(page, titre, y, { font: bold, size: 19, color: ENCRE });
  texte(page, espacer("FACTURE"), y + 4, { font: bold, size: 8, color: SOURDINE }, true);

  y -= 17;
  const date = new Date().toLocaleDateString("fr-FR");
  texte(page, `Generee le ${date}`, y, { font: regular, size: 9, color: SOURDINE });
  return y;
}

function enteteColonnes(page: PDFPage, bold: PDFFont, depart: number): number {
  const y = depart - 38;
  const style: Style = { font: bold, size: 7, color: SOURDINE };
  texte(page, espacer("DESIGNATION"), y, style);
  texte(page, espacer("MONTANT"), y, style, true);
  regle(page, y - 9, 0.9, SOURDINE);
  return y - 9 - INTERLIGNE;
}

function ligneFacture(
  page: PDFPage,
  polices: [PDFFont, PDFFont],
  name: string,
  y: number,
  montant: string,
): void {
  const total = TOTAUX.has(name);
  if (name === "TTC") {
    page.drawRectangle({ x: MARGE, y: y - 8, width: UTILE, height: INTERLIGNE - 4, color: BANDE });
  }
  const style: Style = { font: total ? polices[1] : polices[0], size: 11, color: ENCRE };
  texte(page, libelle(name), y, style);
  texte(page, montant, y, { ...style, size: total ? 12 : 11 }, true);
  regle(page, y - 9, total ? 0.9 : 0.5, total ? SOURDINE : TRAIT);
}

function pied(page: PDFPage, regular: PDFFont): void {
  regle(page, MARGE + 18);
  const style: Style = { font: regular, size: 7.5, color: SOURDINE };
  texte(page, "Document genere par invoice-calc-engine", MARGE + 4, style);
}

export async function renderPdf(engine: Engine): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([LARGEUR_PAGE, HAUTEUR_PAGE]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = enteteColonnes(page, bold, entete(page, regular, bold, engine.document.title));

  for (const field of engine.document.fields.filter(isComputed)) {
    ligneFacture(page, [regular, bold], field.name, y, formatMoney(engine.get(field.name)));
    y -= INTERLIGNE;
  }

  pied(page, regular);
  return pdf.save();
}
