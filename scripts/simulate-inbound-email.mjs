// Simule l'arrivée d'un email Mailgun en local, pour le CHECK de F1 (pas de vrai compte Mailgun nécessaire à ce stade).
// Pour tester F4 (envoi réel), passe ta propre adresse en argument : node scripts/simulate-inbound-email.mjs toi@example.com
const senderOverride = process.argv[2];
const fields = {
  sender: senderOverride || "client.test@example.com",
  recipient: "support@monentreprise.com",
  subject: "Test — problème de facturation",
  "body-plain": "Bonjour, je n'ai pas reçu ma facture de juin. Merci de me la renvoyer.",
  "Message-Id": `<test-${Date.now()}@example.com>`,
};

const form = new FormData();
for (const [key, value] of Object.entries(fields)) {
  form.append(key, value);
}

const res = await fetch("http://localhost:8888/api/inbound-email", {
  method: "POST",
  body: form,
});

console.log("Statut réponse:", res.status);
console.log("Corps réponse:", await res.text());
