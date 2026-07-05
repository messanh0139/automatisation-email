// F3 : composition d'une réponse contextualisée pour un cas standard (via l'API OpenAI).
// N'est appelé que si la classification (F2) a jugé le cas "standard" — voir cas_standard dans classify.js.
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function composeReply({ subject, bodyPlain, classification }) {
  console.log("[compose] appel OpenAI (gpt-4o-mini) pour composer une réponse");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          "Rédige une réponse professionnelle, courte et directement utilisable à cet email entrant.",
          "N'invente aucune information (numéro de dossier, montant, délai...) qui ne serait pas déjà dans l'email ou le contexte fourni.",
          "",
          `Objet original : ${subject || "(sans objet)"}`,
          `Contenu original :\n${bodyPlain || "(vide)"}`,
          "",
          `Intention détectée : ${classification.intention}`,
          `Urgence : ${classification.urgence}`,
          `Contexte : ${classification.contexte}`,
          `Profil client : ${classification.profil_client}`,
        ].join("\n"),
      },
    ],
  });

  const draft = response.choices[0].message.content;
  console.log("[compose] brouillon généré, longueur:", draft.length);
  return draft;
}
