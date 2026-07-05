// Traitement complet d'un email entrant (F1 à F8) : enregistrement, classification, extraction,
// ticket, réponse ou escalade. Indépendant du mécanisme de réception — voir poll-inbox.js.
import { neon } from "@neondatabase/serverless";
import { classifyEmail } from "./classify.js";
import { composeReply } from "./compose.js";
import { extractData } from "./extract.js";
import { createTicketIfNeeded } from "./ticket.js";

const sql = neon(process.env.DATABASE_URL);

export async function processEmail({ messageId, from, to, subject, bodyPlain, rawPayload }) {
  let emailId;
  try {
    const rows = await sql`
      insert into emails (mailgun_message_id, from_address, to_address, subject, body_plain, raw_payload, status)
      values (${messageId}, ${from}, ${to}, ${subject}, ${bodyPlain}, ${JSON.stringify(rawPayload)}, 'reçu')
      returning id
    `;
    emailId = rows[0].id;
    console.log("[process-email] email enregistré avec succès, id:", emailId);
  } catch (err) {
    console.error("[process-email] échec insertion Neon:", err.message);
    return;
  }

  let classification;
  try {
    classification = await classifyEmail({ subject, bodyPlain });
    await sql`
      update emails
      set intention = ${classification.intention},
          urgence = ${classification.urgence},
          contexte = ${classification.contexte},
          profil_client = ${classification.profil_client},
          cas_standard = ${classification.cas_standard},
          status = 'classifié'
      where id = ${emailId}
    `;
    console.log("[process-email] email", emailId, "classifié avec succès, cas_standard:", classification.cas_standard);
  } catch (err) {
    console.error("[process-email] échec classification pour l'email", emailId, ":", err.message);
    return;
  }

  try {
    const donnees = await extractData({ subject, bodyPlain });
    await sql`update emails set donnees_extraites = ${JSON.stringify(donnees)} where id = ${emailId}`;
    console.log("[process-email] email", emailId, "données extraites:", donnees.length);

    await createTicketIfNeeded(emailId, donnees);
  } catch (err) {
    console.error("[process-email] échec extraction/ticket pour l'email", emailId, ":", err.message);
  }

  if (!classification.cas_standard) {
    await sql`update emails set status = 'à escalader' where id = ${emailId}`;
    console.log("[process-email] email", emailId, "escaladé (cas jugé non standard)");
    return;
  }

  try {
    const draft = await composeReply({ subject, bodyPlain, classification });
    await sql`update emails set brouillon_reponse = ${draft}, status = 'brouillon_pret' where id = ${emailId}`;
    console.log("[process-email] email", emailId, "brouillon de réponse prêt");
  } catch (err) {
    console.error("[process-email] échec composition pour l'email", emailId, ":", err.message);
  }
}
