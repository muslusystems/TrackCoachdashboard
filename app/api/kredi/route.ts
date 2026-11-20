import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

// Koçun kendi bakiyesi, öğrenci planları ve son atamalar
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const [ledgerRes, studentsRes] = await Promise.all([
    supabaseAdmin
      .from("credit_ledger")
      .select("id, package_questions, period_months, qty, reason, note, student_id, reverted_at, created_at")
      .eq("coach_id", session.coachId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("students")
      .select("id, name_surname, plan_questions, license_end_date")
      .eq("coach_id", session.coachId)
      .is("deleted_at", null)
      .order("name_surname"),
  ]);
  if (ledgerRes.error) return NextResponse.json({ error: ledgerRes.error.message }, { status: 500 });
  if (studentsRes.error) return NextResponse.json({ error: studentsRes.error.message }, { status: 500 });

  const rows = ledgerRes.data || [];
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = `${r.package_questions}:${r.period_months}`;
    m.set(k, (m.get(k) || 0) + Number(r.qty));
  }
  const balances = Array.from(m, ([k, blocks]) => {
    const [p, mo] = k.split(":").map(Number);
    return { package_questions: p, period_months: mo, blocks };
  })
    .filter((b) => b.blocks !== 0)
    .sort((a, b) => a.package_questions - b.package_questions || a.period_months - b.period_months);

  const students = studentsRes.data || [];
  const names = new Map(students.map((s: any) => [s.id, s.name_surname]));
  // Geri alınabilir son atama: öğrenci başına en son, henüz geri alınmamış 'assign'
  const latestAssign = new Map<string, string>();
  for (const r of rows) {
    if (r.reason === "assign" && !r.reverted_at && r.student_id && !latestAssign.has(r.student_id)) {
      latestAssign.set(r.student_id, r.id);
    }
  }
  const history = rows
    .filter((r) => r.reason === "assign" || r.reason === "refund")
    .slice(0, 30)
    .map((r: any) => ({
      id: r.id,
      kind: r.reason,
      package_questions: r.package_questions,
      period_months: r.period_months,
      student_name: names.get(r.student_id) || "(silinmiş öğrenci)",
      reverted: !!r.reverted_at,
      can_revert: r.reason === "assign" && latestAssign.get(r.student_id) === r.id,
      created_at: r.created_at,
    }));

  return NextResponse.json({ balances, students, history });
}
