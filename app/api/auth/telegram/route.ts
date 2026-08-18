import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramAuth, type TelegramAuthData } from "@/lib/telegramAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const data: TelegramAuthData = {
    id: Number(params.get("id")),
    first_name: params.get("first_name") || "",
    last_name: params.get("last_name") || undefined,
    username: params.get("username") || undefined,
    photo_url: params.get("photo_url") || undefined,
    auth_date: Number(params.get("auth_date")),
    hash: params.get("hash") || "",
  };

  if (!data.id || !data.hash) {
    return NextResponse.redirect(
      new URL("/login?error=eksik_veri", request.url)
    );
  }

  let valid = false;
  try {
    valid = verifyTelegramAuth(data);
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=sunucu_ayari", request.url)
    );
  }

  if (!valid) {
    return NextResponse.redirect(
      new URL("/login?error=dogrulama_basarisiz", request.url)
    );
  }

  const { data: coach, error } = await supabaseAdmin
    .from("coaches")
    .select("id, name, telegram_id")
    .eq("telegram_id", String(data.id))
    .is("deleted_at", null)
    .single();

  if (error || !coach) {
    return NextResponse.redirect(
      new URL("/login?error=kayitli_kocu_bulunamadi", request.url)
    );
  }

  await createSession({
    coachId: coach.id,
    telegramId: String(coach.telegram_id),
    name: coach.name,
  });

  return NextResponse.redirect(new URL("/ogrenciler", request.url));
}
