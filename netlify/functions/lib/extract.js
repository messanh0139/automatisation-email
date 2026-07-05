// F5 : extraction des données utiles d'un email via l'API OpenAI (référence commande, coordonnées, montant...).
// Sortie flexible (liste de paires label/valeur) : le PRD ne fige pas de schéma métier tant que le CRM cible n'est pas choisi.
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    donnees: {
      type: "array",
      description: "Données utiles trouvées dans l'email (vide si aucune)",
      items: {
        type: "object",
        properties: {
          label: {
            type: "string",
            description: "Nom court de la donnée (ex: référence commande, numéro de téléphone, montant, date...)",
          },
          valeur: { type: "string" },
        },
        required: ["label", "valeur"],
        additionalProperties: false,
      },
    },
  },
  required: ["donnees"],
  additionalProperties: false,
};

export async function extractData({ subject, bodyPlain }) {
  console.log("[extract] appel OpenAI (gpt-4o-mini) pour extraction");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Extrait toutes les données utiles et exploitables de cet email (référence commande, coordonnées, montant, date, etc.). N'invente rien : n'extrais que ce qui est explicitement présent dans le texte.\n\nObjet : ${subject || "(sans objet)"}\n\nContenu :\n${bodyPlain || "(vide)"}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "email_extraction",
        strict: true,
        schema: EXTRACTION_SCHEMA,
      },
    },
  });

  const result = JSON.parse(response.choices[0].message.content);
  console.log("[extract] résultat:", result.donnees);
  return result.donnees;
}
