// F6 : création d'un ticket à partir des données extraites (F5), uniquement si des données ont été trouvées.
// F7 : synchronisation du ticket avec le CRM (adaptateur générique, connecteur HubSpot).
import { neon } from "@neondatabase/serverless";
import { syncTicket } from "./crm/index.js";

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

  try {
    const crmId = await syncTicket({ id: ticketId, donnees });
    await sql`update tickets set statut = 'synchronisé', crm_id = ${crmId} where id = ${ticketId}`;
    console.log("[ticket] ticket", ticketId, "synchronisé avec le CRM, id CRM:", crmId);
  } catch (err) {
    console.error("[ticket] échec synchronisation CRM pour le ticket", ticketId, ":", err.message);
    // Le ticket reste "ouvert" en base — la synchro sera à retraiter plus tard.
  }

  return ticketId;
}
