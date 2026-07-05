// Point d'entrée F1 : reçoit le webhook Mailgun (multipart/form-data) et enregistre l'email brut dans Neon.
// Pas de vérification de signature Mailgun pour l'instant (dette de sécurité assumée, cf. archi-stack.md / plan-action.md) —
// à ajouter avant le GO MISE EN LIGNE.
import { neon } from "@neondatabase/serverless";
import multipart from "parse-multipart-data";

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

  try {
    await sql`
      insert into emails (mailgun_message_id, from_address, to_address, subject, body_plain, raw_payload, status)
      values (
        ${fields["Message-Id"] || null},
        ${fields["sender"] || null},
        ${fields["recipient"] || null},
        ${fields["subject"] || null},
        ${fields["body-plain"] || null},
        ${JSON.stringify(fields)},
        'reçu'
      )
    `;
  } catch (err) {
    console.error("[inbound-email] échec insertion Neon:", err.message);
    return { statusCode: 500, body: "Erreur enregistrement" };
  }

  console.log("[inbound-email] email enregistré avec succès");
  return { statusCode: 200, body: "OK" };
}
