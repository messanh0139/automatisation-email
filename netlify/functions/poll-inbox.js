// F1 (révisé) : relève périodique de la boîte Gmail (IMAP) — remplace l'ancien webhook Mailgun.
// Même compte que l'envoi (F4) : aucun nouveau compte externe nécessaire.
//
// GARDE-FOU CRITIQUE : ne traite jamais l'historique de la boîte, seulement les emails
// arrivés depuis IMAP_SINCE_DATE. Incident du 6 juillet 2026 : une boîte Gmail réelle avec
// des milliers d'emails non lus a été traitée par erreur (filtrage sur \Seen uniquement),
// créant de faux tickets CRM. Le filtre par date est la protection contre une récidive,
// indépendante du statut lu/non lu.
import { schedule } from "@netlify/functions";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { processEmail } from "./lib/process-email.js";

const LOT_MAX = 3; // sécurité : chaque email prend ~10-15s (Claude + CRM + SMTP), la Function a 30s max

async function pollInbox() {
  const client = new ImapFlow({
    host: process.env.IMAP_HOST,
    port: Number(process.env.IMAP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    logger: false,
  });

  await client.connect();
  const lock = await client.getMailboxLock("INBOX");
  let traites = 0;

  try {
    const depuis = new Date(process.env.IMAP_SINCE_DATE);
    const tousLesUids = await client.search({ seen: false, since: depuis }, { uid: true });
    const uids = tousLesUids.slice(0, LOT_MAX);
    console.log(
      "[poll-inbox] emails non lus depuis",
      process.env.IMAP_SINCE_DATE,
      ":",
      tousLesUids.length,
      "— traités ce tour:",
      uids.length,
    );

    if (uids.length === 0) {
      return;
    }

    for await (const message of client.fetch(uids, { source: true, envelope: true }, { uid: true })) {
      const parsed = await simpleParser(message.source);

      await processEmail({
        messageId: parsed.messageId || null,
        from: parsed.from?.value?.[0]?.address || null,
        to: parsed.to?.value?.[0]?.address || null,
        subject: parsed.subject || null,
        bodyPlain: parsed.text || null,
        rawPayload: { from: parsed.from?.text, to: parsed.to?.text, subject: parsed.subject },
      });

      await client.messageFlagsAdd(message.uid, ["\\Seen"]);
      traites++;
    }
  } finally {
    lock.release();
    await client.logout();
  }

  console.log("[poll-inbox] terminé,", traites, "email(s) traité(s)");
}

export const handler = schedule("*/5 * * * *", async () => {
  await pollInbox();
  return { statusCode: 200 };
});
