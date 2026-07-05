// F1 (révisé) : relève périodique de la boîte Gmail (IMAP) — remplace l'ancien webhook Mailgun.
// Même compte que l'envoi (F4) : aucun nouveau compte externe nécessaire.
import { schedule } from "@netlify/functions";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { processEmail } from "./lib/process-email.js";

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
    const uids = await client.search({ seen: false }, { uid: true });
    console.log("[poll-inbox] emails non lus trouvés:", uids.length);

    for await (const message of client.fetch(uids, { source: true, envelope: true })) {
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
