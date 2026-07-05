// F7 : point d'entrée générique de l'adaptateur CRM — délègue au connecteur configuré.
// Pour changer de CRM : écrire un nouveau fichier connecteur dans ce dossier, puis changer cet import.
import { syncTicket as syncTicketHubspot } from "./hubspot.js";

export async function syncTicket(ticket) {
  return syncTicketHubspot(ticket);
}
