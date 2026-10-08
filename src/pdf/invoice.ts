import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Engine } from "../engine/evaluator.js";
import { formatMoney } from "../engine/money.js";
import { isComputed } from "../engine/types.js";

const MARGE = 60;
const LARGEUR = 475;
const HAUTEUR_PAGE = 842;
const INTERLIGNE = 24;

function sansAccent(texte: string): string {
  return texte.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function ligne(page: PDFPage, font: PDFFont, gauche: string, droite: string, y: number): void {
  page.drawText(sansAccent(gauche), { x: MARGE, y, size: 11, font });
  const largeur = font.widthOfTextAtSize(droite, 11);
  page.drawText(droite, { x: MARGE + LARGEUR - largeur, y, size: 11, font });
  page.drawLine({
    start: { x: MARGE, y: y - 8 },
    end: { x: MARGE + LARGEUR, y: y - 8 },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
}

function entete(page: PDFPage, regular: PDFFont, bold: PDFFont, titre: string): number {
  let y = HAUTEUR_PAGE - MARGE;
  page.drawText(sansAccent(titre), { x: MARGE, y, size: 18, font: bold });
  y -= 24;
  page.drawText(sansAccent(`Generee le ${new Date().toLocaleDateString("fr-FR")}`), {
    x: MARGE,
    y,
    size: 9,
    font: regular,
    color: rgb(0.4, 0.4, 0.4),
  });
  return y - 34;
}

export async function renderPdf(engine: Engine): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, HAUTEUR_PAGE]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = entete(page, regular, bold, engine.document.title);
  const calcules = engine.document.fields.filter(isComputed);

  for (const field of calcules) {
    const total = field === calcules.at(-1);
    const montant = formatMoney(engine.get(field.name));
    ligne(page, total ? bold : regular, field.name, montant, y);
    y -= INTERLIGNE;
  }

  return pdf.save();
}
