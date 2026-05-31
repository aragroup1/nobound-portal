import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getSessionAndRole() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, role: null as null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return {
    supabase,
    user,
    role: (profile?.role as "admin" | "client" | null) ?? null,
  };
}

export async function requireAdmin() {
  const ctx = await getSessionAndRole();
  if (!ctx.user) redirect("/login");
  if (ctx.role !== "admin") redirect("/portal");
  return ctx as typeof ctx & { user: NonNullable<typeof ctx.user>; role: "admin" };
}

export async function requireClient() {
  const ctx = await getSessionAndRole();
  if (!ctx.user) redirect("/login");
  if (ctx.role !== "client") redirect("/admin");
  return ctx as typeof ctx & { user: NonNullable<typeof ctx.user>; role: "client" };
}
