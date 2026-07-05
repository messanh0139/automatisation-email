// Point d'entrée F1 : reçoit le webhook Mailgun (multipart/form-data) et enregistre l'email brut dans Neon.
// Pas de vérification de signature Mailgun pour l'instant (dette de sécurité assumée, cf. archi-stack.md / plan-action.md) —
// à ajouter avant le GO MISE EN LIGNE.
import { neon } from "@neondatabase/serverless";
import multipart from "parse-multipart-data";
import { classifyEmail } from "./lib/classify.js";
import { composeReply } from "./lib/compose.js";
import { extractData } from "./lib/extract.js";

const sql = neon(process.env.DATABASE_URL);

export async function handler(event) {
  console.log("[inbound-email] requête reçue, content-type:", event.headers["content-type"]);

  const contentType = event.headers["content-type"] || "";
  const boundaryMatch = contentType.match(/boundary=(.*)$/);
  if (!boundaryMatch) {
    console.error("[inbound-email] pas de boundary multipart trouvé, requête ignorée");
    return { statusCode: 400, body: "Content-Type multipart/form-data attendu" };
  }

  const bodyBuffer = Buffer.from(event.body, event.isBase64Encoded ? "base64" : "utf8");
  const parts = multipart.parse(bodyBuffer, boundaryMatch[1]);

  const fields = {};
  for (const part of parts) {
    if (part.name) fields[part.name] = part.data.toString();
  }
  console.log("[inbound-email] champs extraits:", Object.keys(fields));

  const subject = fields["subject"] || null;
  const bodyPlain = fields["body-plain"] || null;
  let emailId;

  try {
    const rows = await sql`
      insert into emails (mailgun_message_id, from_address, to_address, subject, body_plain, raw_payload, status)
      values (
        ${fields["Message-Id"] || null},
        ${fields["sender"] || null},
        ${fields["recipient"] || null},
        ${subject},
        ${bodyPlain},
        ${JSON.stringify(fields)},
        'reçu'
      )
      returning id
    `;
    emailId = rows[0].id;
    console.log("[inbound-email] email enregistré avec succès, id:", emailId);
  } catch (err) {
    console.error("[inbound-email] échec insertion Neon:", err.message);
    return { statusCode: 500, body: "Erreur enregistrement" };
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
    console.log("[inbound-email] email", emailId, "classifié avec succès, cas_standard:", classification.cas_standard);
  } catch (err) {
    console.error("[inbound-email] échec classification pour l'email", emailId, ":", err.message);
    // L'email reste enregistré avec le statut "reçu" — pas de perte de données,
    // juste une classification en échec à retraiter plus tard.
    return { statusCode: 200, body: "OK (email enregistré, classification en échec)" };
  }

  try {
    const donnees = await extractData({ subject, bodyPlain });
    await sql`
      update emails
      set donnees_extraites = ${JSON.stringify(donnees)}
      where id = ${emailId}
    `;
    console.log("[inbound-email] email", emailId, "données extraites:", donnees.length);
  } catch (err) {
    console.error("[inbound-email] échec extraction pour l'email", emailId, ":", err.message);
    // Ne bloque pas la suite (composition/envoi) : l'extraction sera à retraiter plus tard si besoin.
  }

  if (!classification.cas_standard) {
    console.log("[inbound-email] email", emailId, "jugé non standard — pas de brouillon (escalade à venir en F8)");
    return { statusCode: 200, body: "OK (cas non standard, en attente d'escalade)" };
  }

  try {
    const draft = await composeReply({ subject, bodyPlain, classification });
    await sql`
      update emails
      set brouillon_reponse = ${draft},
          status = 'brouillon_pret'
      where id = ${emailId}
    `;
    console.log("[inbound-email] email", emailId, "brouillon de réponse prêt");
  } catch (err) {
    console.error("[inbound-email] échec composition pour l'email", emailId, ":", err.message);
    // L'email reste enregistré et classifié — juste la composition à retraiter plus tard.
    return { statusCode: 200, body: "OK (email classifié, composition en échec)" };
  }

  return { statusCode: 200, body: "OK" };
}
