// Simule l'arrivée d'un email Mailgun en local, pour le CHECK de F1 (pas de vrai compte Mailgun nécessaire à ce stade).
const fields = {
  sender: "client.test@example.com",
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
