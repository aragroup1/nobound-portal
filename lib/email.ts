import { Resend } from "resend";
import type { ReactElement } from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(args: {
  to: string | string[];
  subject: string;
  react: ReactElement;
}) {
  const from = process.env.RESEND_FROM_EMAIL ?? "NoBound <onboarding@resend.dev>";
  return resend.emails.send({ from, ...args });
}

export const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? "araltd@hotmail.com";
