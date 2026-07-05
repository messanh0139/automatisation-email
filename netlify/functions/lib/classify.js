// F2 : classification d'un email via l'API OpenAI (intention, urgence, contexte, profil client).
// Sortie forcée en JSON structuré (response_format json_schema, strict) pour ne jamais avoir à parser du texte libre fragile.
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CLASSIFICATION_SCHEMA = {
  type: "object",
  properties: {
    intention: {
      type: "string",
      description: "Intention principale du message (ex: réclamation, demande d'information, support technique, résiliation...)",
    },
    urgence: { type: "string", enum: ["faible", "moyenne", "haute"] },
    contexte: {
      type: "string",
      description: "Résumé court (1-2 phrases) du contexte de la demande",
    },
    profil_client: {
      type: "string",
      description: "Profil déduit du ton et du contenu du message (ex: nouveau contact, client mécontent, client fidèle...)",
    },
  },
  required: ["intention", "urgence", "contexte", "profil_client"],
  additionalProperties: false,
};

export async function classifyEmail({ subject, bodyPlain }) {
  console.log("[classify] appel OpenAI (gpt-4o-mini) pour classification");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Classe cet email entrant.\n\nObjet : ${subject || "(sans objet)"}\n\nContenu :\n${bodyPlain || "(vide)"}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "email_classification",
        strict: true,
        schema: CLASSIFICATION_SCHEMA,
      },
    },
  });

  const result = JSON.parse(response.choices[0].message.content);
  console.log("[classify] résultat:", result);
  return result;
}
