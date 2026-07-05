// F4 : envoie réellement le brouillon (F3) au client, sur déclenchement explicite (pas d'envoi automatique).
import { neon } from "@neondatabase/serverless";
import { sendReply } from "./lib/send.js";

const sql = neon(process.env.DATABASE_URL);

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Méthode non autorisée" };
  }

  let emailId;
  try {
    emailId = JSON.parse(event.body).id;
  } catch {
    return { statusCode: 400, body: 'Corps JSON invalide, attendu: { "id": <id> }' };
  }
  if (!emailId) {
    return { statusCode: 400, body: "Paramètre 'id' manquant" };
  }

  console.log("[send-reply] déclenchement pour l'email", emailId);

  const rows = await sql`select * from emails where id = ${emailId}`;
  const email = rows[0];

  if (!email) {
    return { statusCode: 404, body: "Email introuvable" };
  }

  if (email.status !== "brouillon_pret") {
    console.warn("[send-reply] statut inattendu pour l'email", emailId, ":", email.status);
    return { statusCode: 409, body: `Statut actuel: ${email.status} (attendu: brouillon_pret)` };
  }

  try {
    await sendReply({
      to: email.from_address,
      subject: email.subject,
      body: email.brouillon_reponse,
    });
    await sql`update emails set status = 'répondu' where id = ${emailId}`;
    console.log("[send-reply] email", emailId, "envoyé avec succès");
  } catch (err) {
    console.error("[send-reply] échec envoi pour l'email", emailId, ":", err.message);
    return { statusCode: 500, body: "Erreur envoi" };
  }

  return { statusCode: 200, body: "OK" };
}
