// F6 : création d'un ticket à partir des données extraites (F5), uniquement si des données ont été trouvées.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export async function createTicketIfNeeded(emailId, donnees) {
  if (!donnees || donnees.length === 0) {
    console.log("[ticket] aucune donnée exploitable, pas de ticket pour l'email", emailId);
    return null;
  }

  console.log("[ticket] création d'un ticket pour l'email", emailId);

  const rows = await sql`
    insert into tickets (email_id, donnees, statut)
    values (${emailId}, ${JSON.stringify(donnees)}, 'ouvert')
    returning id
  `;

  const ticketId = rows[0].id;
  console.log("[ticket] ticket", ticketId, "créé (email", emailId, ")");
  return ticketId;
}
