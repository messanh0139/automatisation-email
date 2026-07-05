// Déclenche l'envoi de la réponse pour un email donné (F4).
// Déclenchement manuel pour l'instant, en attendant un bouton "valider et envoyer" dans le dashboard (F9).
const id = process.argv[2];
if (!id) {
  console.error("Usage: node scripts/trigger-send-reply.mjs <id_email>");
  process.exit(1);
}

const res = await fetch("http://localhost:8888/api/send-reply", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ id: Number(id) }),
});

console.log("Statut réponse:", res.status);
console.log("Corps réponse:", await res.text());
