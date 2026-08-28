import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSession } from "@/lib/session";

const EXPIRY_MS = 3 * 60 * 1000; // 3 dakika

export async function GET(request: NextRequest) {
  const nonce = request.nextUrl.searchParams.get("nonce");
  if (!nonce) {
    return NextResponse.json({ status: "error" }, { status: 400 });
  }

  const { data: token, error } = await supabaseAdmin
    .from("login_tokens")
    .select("nonce, coach_id, status, created_at")
    .eq("nonce", nonce)
    .single();

  if (error || !token) {
    return NextResponse.json({ status: "not_found" });
  }

  const age = Date.now() - new Date(token.created_at).getTime();
  if (age > EXPIRY_MS) {
    await supabaseAdmin.from("login_tokens").delete().eq("nonce", nonce);
    return NextResponse.json({ status: "expired" });
  }

  if (token.status !== "confirmed" || !token.coach_id) {
    return NextResponse.json({ status: "pending" });
  }

  const { data: coach } = await supabaseAdmin
    .from("coaches")
    .select("id, name, telegram_id")
    .eq("id", token.coach_id)
    .single();

  if (!coach) {
    return NextResponse.json({ status: "pending" });
  }

  await createSession({
    coachId: coach.id,
    telegramId: String(coach.telegram_id),
    name: coach.name,
  });

  // Tek kullanımlık — kullanıldıktan sonra sil
  await supabaseAdmin.from("login_tokens").delete().eq("nonce", nonce);

  return NextResponse.json({ status: "confirmed" });
}
