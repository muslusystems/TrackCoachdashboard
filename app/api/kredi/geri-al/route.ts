import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

// Öğrencinin en son atamasını geri alır, blok koça iade edilir: { ledger_id }
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const b = await req.json().catch(() => null);
  const ledgerId = String(b?.ledger_id || "");
  if (!ledgerId) return NextResponse.json({ error: "Kayıt seçilmedi" }, { status: 400 });

  const { data: row } = await supabaseAdmin
    .from("credit_ledger")
    .select("*")
    .eq("id", ledgerId)
    .eq("coach_id", session.coachId)
    .eq("reason", "assign")
    .maybeSingle();
  if (!row || !row.student_id) return NextResponse.json({ error: "Atama bulunamadı" }, { status: 404 });
  if (row.reverted_at) return NextResponse.json({ error: "Bu atama zaten geri alınmış" }, { status: 400 });

  // Yalnızca öğrencinin en son atamasıdır geri alınabilir
  const { data: later } = await supabaseAdmin
    .from("credit_ledger")
    .select("id")
    .eq("student_id", row.student_id)
    .eq("reason", "assign")
    .is("reverted_at", null)
    .gt("created_at", row.created_at)
    .limit(1);
  if (later && later.length > 0) {
    return NextResponse.json({ error: "Önce öğrencinin daha yeni atamasını geri al" }, { status: 400 });
  }

  // Koşullu işaretleme: aynı atama iki kez iade edilemesin
  const { data: marked } = await supabaseAdmin
    .from("credit_ledger")
    .update({ reverted_at: new Date().toISOString() })
    .eq("id", ledgerId)
    .is("reverted_at", null)
    .select("id");
  if (!marked || marked.length === 0) {
    return NextResponse.json({ error: "Bu atama zaten geri alınmış" }, { status: 400 });
  }

  const { error: iErr } = await supabaseAdmin.from("credit_ledger").insert({
    coach_id: session.coachId,
    package_questions: row.package_questions,
    period_months: row.period_months,
    qty: 1,
    reason: "refund",
    student_id: row.student_id,
    note: "Atama geri alındı",
  });
  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

  const { error: uErr } = await supabaseAdmin
    .from("students")
    .update({ plan_questions: row.prev_plan_questions, license_end_date: row.prev_license_end })
    .eq("id", row.student_id)
    .eq("coach_id", session.coachId);
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
