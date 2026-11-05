import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkSecret } from "@/lib/telegramBot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// n8n (öğrenci botu): davet linkiyle gelen kişinin daha önce silinmiş kaydı varsa geri açar.
// Gövde: { studentTelegramId, coachId }  →  { restored: boolean }
// Geri açılan kayıt: deleted_at boşalır, yeni koça bağlanır, sınıf sıfırlanır (koç yeniden seçer),
// lisans yeni kayıttaki gibi 30 gün.
export async function POST(req: Request) {
  if (!checkSecret(req)) return new Response("Yetkisiz", { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b?.studentTelegramId || !b?.coachId) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  const { data: rows, error } = await supabaseAdmin
    .from("students")
    .select("id")
    .eq("telegram_id", String(b.studentTelegramId))
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false })
    .limit(1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!rows || !rows[0]) return NextResponse.json({ restored: false });

  const license = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const { error: uErr } = await supabaseAdmin
    .from("students")
    .update({
      deleted_at: null,
      coach_id: b.coachId,
      class_id: null,
      status: "active",
      license_end_date: license,
    })
    .eq("id", rows[0].id);
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });
  return NextResponse.json({ restored: true, studentId: rows[0].id });
}
