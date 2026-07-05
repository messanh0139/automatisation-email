// F7 : connecteur CRM — implémentation HubSpot.
// Utilise l'objet natif "Tickets" de HubSpot (pipeline et étape par défaut d'un compte HubSpot standard).
// Si la création échoue avec un message sur hs_pipeline/hs_pipeline_stage, ces identifiants
// diffèrent sur ce compte HubSpot — à ajuster ici (Settings > Objects > Tickets > Pipelines).
export async function syncTicket(ticket) {
  console.log("[crm:hubspot] synchronisation du ticket", ticket.id);

  const subject = ticket.donnees.map((d) => `${d.label}: ${d.valeur}`).join(" | ") || `Ticket #${ticket.id}`;

  const res = await fetch("https://api.hubapi.com/crm/v3/objects/tickets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        subject,
        content: JSON.stringify(ticket.donnees),
        hs_pipeline: "0",
        hs_pipeline_stage: "1",
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HubSpot a répondu ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  console.log("[crm:hubspot] ticket HubSpot créé, id:", data.id);
  return data.id;
}
