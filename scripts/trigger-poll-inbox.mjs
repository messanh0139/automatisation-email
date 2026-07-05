// Déclenche manuellement une relève de la boîte mail (F1), pour le CHECK en local.
// Envoie d'abord un vrai email à l'adresse configurée dans SMTP_USER, puis lance ce script.
const res = await fetch("http://localhost:8888/.netlify/functions/poll-inbox");

console.log("Statut réponse:", res.status);
console.log("Corps réponse:", await res.text());
