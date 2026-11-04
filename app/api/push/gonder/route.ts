import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendPushToCoach } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// n8n'den çağrılır. Gövde: { telegramId | coachId, title, body, url?, tag? }
export async function POST(req: Request) {
  const secret = process.env.NEXT_PUBLIC_TRACKCOACH_WEBHOOK_SECRET || process.env.TRACKCOACH_WEBHOOK_SECRET;
  if (!secret || req.headers.get("x-trackcoach-secret") !== secret) {
    return new Response("Yetkisiz", { status: 401 });
  }
  const b = await req.json().catch(() => null);
  if (!b || !b.title || !b.body || (!b.coachId && !b.telegramId)) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }
  let coachId: string | null = b.coachId || null;
  if (!coachId) {
    const { data } = await supabaseAdmin.from("coaches").select("id").eq("telegram_id", String(b.telegramId)).limit(1);
    coachId = data && data[0] ? data[0].id : null;
  }
  if (!coachId) return NextResponse.json({ error: "Koç bulunamadı" }, { status: 404 });
  try {
    const r = await sendPushToCoach(coachId, {
      title: String(b.title).slice(0, 80),
      body: String(b.body).slice(0, 240),
      url: b.url || "/",
      tag: b.tag,
    });
    return NextResponse.json(r);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Hata" }, { status: 500 });
  }
}
