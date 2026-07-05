// F4 : envoi réel de la réponse générée (F3) au client, via ton propre compte email (SMTP direct, nodemailer).
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendReply({ to, subject, body }) {
  console.log("[send] envoi via SMTP à", to);

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: `Re: ${subject || "votre message"}`,
    text: body,
  });

  console.log("[send] envoi SMTP réussi");
}
