import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * DİKKAT: Bu client SERVICE ROLE KEY kullanır ve Row Level Security'yi bypass eder.
 * Sadece server component / route handler içinde import et.
 * Asla bir "use client" dosyasına import etme veya client'a gönderme.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
