export type Role = "admin" | "client";

export type ClientStatus = "active" | "paused" | "cancelled";

export type SubscriptionStatus =
  | "none"
  | "incomplete"
  | "trialing"
  | "active"
  | "past_due"
  | "unpaid"
  | "canceled";

export type TicketType = "modification" | "emergency";

export type TicketStatus =
  | "new"
  | "priced"
  | "awaiting_payment"
  | "paid"
  | "in_progress"
  | "complete"
  | "declined"
  | "cancelled";

export interface Profile {
  id: string;
  role: Role;
  created_at: string;
}

export interface Client {
  id: string;
  profile_id: string | null;
  name: string;
  email: string;
  business_name: string | null;
  website_url: string | null;
  has_hosting: boolean;
  has_seo: boolean;
  status: ClientStatus;
  notes: string | null;
  started_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: SubscriptionStatus | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  client_id: string;
  stripe_invoice_id: string;
  amount_pence: number;
  status: string;
  invoice_pdf_url: string | null;
  hosted_invoice_url: string | null;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  client_id: string;
  title: string;
  description: string;
  type: TicketType;
  attachment_urls: string[];
  status: TicketStatus;
  price_pence: number | null;
  admin_notes: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  priced_at: string | null;
  payment_sent_at: string | null;
  paid_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
