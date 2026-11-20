import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// coaches.is_admin işareti true olan koç yöneticidir. Sütun yoksa ya da okunamazsa yönetici değildir.
export async function isAdminCoach(coachId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("coaches")
    .select("is_admin")
    .eq("id", coachId)
    .maybeSingle();
  if (error || !data) return false;
  return (data as { is_admin?: boolean }).is_admin === true;
}

export const PACKAGES = [200, 400, 600] as const;
