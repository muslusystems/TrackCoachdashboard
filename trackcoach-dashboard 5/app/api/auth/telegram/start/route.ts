import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  const nonce = crypto.randomBytes(16).toString("hex");

  const { error } = await supabaseAdmin
    .from("login_tokens")
    .insert({ nonce, status: "pending" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const deepLink = `https://t.me/${botUsername}?start=login_${nonce}`;

  return NextResponse.json({ nonce, deepLink });
}
