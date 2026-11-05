import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { adminBot, checkSecret } from "@/lib/telegramBot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// n8n (öğrenci botu), yeni öğrenci kaydolunca çağırır: koça sınıf seçenekli bildirim gider.
// Gövde: { coachTelegramId, studentTelegramId, studentName }
export async function POST(req: Request) {
  if (!checkSecret(req)) return new Response("Yetkisiz", { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b?.coachTelegramId || !b?.studentTelegramId) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }
  const coachTg = String(b.coachTelegramId);
  const stTg = String(b.studentTelegramId);
  const name = String(b.studentName || "").trim() || "Yeni öğrenci";

  const { data: coach } = await supabaseAdmin.from("coaches").select("id").eq("telegram_id", coachTg).limit(1);
  if (!coach || !coach[0]) return NextResponse.json({ error: "Koç bulunamadı" }, { status: 404 });
  const { data: classes } = await supabaseAdmin
    .from("classes")
    .select("id, class_name")
    .eq("coach_id", coach[0].id)
    .order("class_name");

  const rows: { text: string; callback_data: string }[][] = (classes || [])
    .slice(0, 30)
    .map((c: any) => [{ text: "🏫 " + c.class_name, callback_data: `snfsec_${stTg}_${c.id}` }]);
  rows.push([{ text: "➕ Yeni sınıf oluştur ve ekle", callback_data: `snfyeni_${stTg}` }]);
  rows.push([{ text: "⏭ Sonra seçerim", callback_data: `snfsonra_${stTg}` }]);

  const r = await adminBot("sendMessage", {
    chat_id: coachTg,
    text: `🎉 Öğrenciniz sisteme kaydoldu: ${name}
Sana bağlandı.

Bu öğrenciyi hangi sınıfa eklemek istersiniz?`,
    reply_markup: { inline_keyboard: rows },
  });
  if (!r.ok) return NextResponse.json({ error: r.description || "Telegram hatası" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
