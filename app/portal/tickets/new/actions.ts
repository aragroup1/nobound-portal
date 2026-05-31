"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireClient } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail, ADMIN_EMAIL } from "@/lib/email";
import { appUrl } from "@/lib/stripe";
import { TicketNewAdminEmail } from "@/emails/ticket-new-admin";

const schema = z.object({
  title: z.string().min(3, "Add a short title.").max(120),
  description: z.string().min(10, "A little more detail, please."),
});

export type RaiseState = { ok: boolean; message?: string; fieldErrors?: Record<string, string> };

export async function raiseTicket(_prev: RaiseState, formData: FormData): Promise<RaiseState> {
  const { user } = await requireClient();
  const parsed = schema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
    return { ok: false, fieldErrors };
  }

  const admin = createSupabaseAdminClient();
  const { data: client } = await admin
    .from("clients")
    .select("id, name, email")
    .eq("profile_id", user.id)
    .single();
  if (!client) return { ok: false, message: "Client record missing." };

  const { data: ticket, error } = await admin
    .from("tickets")
    .insert({
      client_id: client.id,
      title: parsed.data.title,
      description: parsed.data.description,
      status: "new",
    })
    .select("id")
    .single();
  if (error || !ticket) return { ok: false, message: error?.message ?? "Failed to raise." };

  try {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `New change request from ${client.name}`,
      react: TicketNewAdminEmail({
        clientName: client.name,
        title: parsed.data.title,
        description: parsed.data.description,
        ticketUrl: appUrl(`/admin/tickets/${ticket.id}`),
      }),
    });
  } catch (err) {
    console.error("Admin notify failed:", err);
  }

  redirect(`/portal/tickets/${ticket.id}?new=1`);
}
