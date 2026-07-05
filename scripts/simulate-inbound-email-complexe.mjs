// Simule un email jugé "non standard" (F8), pour vérifier le chemin d'escalade.
const senderOverride = process.argv[2];
const fields = {
  sender: senderOverride || "client.test@example.com",
  recipient: "support@monentreprise.com",
  subject: "Mise en demeure — préjudice subi",
  "body-plain": "Je vous informe que je consulte actuellement un avocat concernant le préjudice financier causé par vos services. Je vous mets en demeure de me répondre sous 8 jours, faute de quoi j'engagerai une action en justice.",
  "Message-Id": `<test-complexe-${Date.now()}@example.com>`,
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
