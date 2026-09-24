import { computed, source, type InvoiceDocument } from "./engine/types.js";

export const courseVtc: InvoiceDocument = {
  title: "Course VTC Nice - Monaco",
  fields: [
    source("prix_km", 250),
    source("distance", 22),
    source("majoration_nuit", 0.2),
    source("frais_reservation", 300),
    source("remise", 500),
    source("TVA", 0.1),

    computed("base_HT", "prix_km * distance"),
    computed("majoration", "base_HT * majoration_nuit"),
    computed("HT", "base_HT + majoration + frais_reservation - remise"),
    computed("montant_TVA", "HT * TVA"),
    computed("TTC", "HT + montant_TVA"),
  ],
};

export const factureCyclique: InvoiceDocument = {
  title: "Facture cyclique",
  fields: [
    source("prix_km", 250),
    computed("HT", "prix_km + remise"),
    computed("remise", "TTC * 0.1"),
    computed("TTC", "HT * 1.1"),
  ],
};
