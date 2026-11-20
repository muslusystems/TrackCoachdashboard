import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { PACKAGES } from "@/lib/admin";

export const dynamic = "force-dynamic";

function addMonths(base: Date, months: number): Date {
  const d = new Date(base.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}

// Koç, bakiyesindeki bir bloğu öğrencisine tanımlar: { student_id, package_questions, period_months }
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const b = await req.json().catch(() => null);
  const studentId = String(b?.student_id || "");
  const pkg = Number(b?.package_questions);
  const period = Number(b?.period_months);
  if (!studentId) return NextResponse.json({ error: "Öğrenci seçilmedi" }, { status: 400 });
  if (!(PACKAGES as readonly number[]).includes(pkg)) {
    return NextResponse.json({ error: "Geçersiz soru kotası" }, { status: 400 });
  }
  if (!Number.isInteger(period) || period < 1 || period > 10) {
    return NextResponse.json({ error: "Geçersiz süre" }, { status: 400 });
  }

  const { data: student } = await supabaseAdmin
    .from("students")
    .select("id, plan_questions, license_end_date")
    .eq("id", studentId)
    .eq("coach_id", session.coachId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!student) return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });

  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  const currentEnd = student.license_end_date ? new Date(student.license_end_date + "T00:00:00Z") : null;
  const active = !!currentEnd && currentEnd >= today;
  if (active && student.plan_questions && student.plan_questions !== pkg) {
    return NextResponse.json(
      { error: `Öğrencinin ${student.plan_questions} soruluk paketi sürüyor. Farklı paket, süre bitince atanabilir.` },
      { status: 400 }
    );
  }

  const { data: rows, error: bErr } = await supabaseAdmin
    .from("credit_ledger")
    .select("qty")
    .eq("coach_id", session.coachId)
    .eq("package_questions", pkg)
    .eq("period_months", period);
  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 });
  const balance = (rows || []).reduce((s, r: any) => s + Number(r.qty), 0);
  if (balance < 1) return NextResponse.json({ error: "Bu pakette kredin yok" }, { status: 400 });

  const base = active && currentEnd ? currentEnd : today;
  const newEnd = addMonths(base, period).toISOString().slice(0, 10);

  const { error: iErr } = await supabaseAdmin.from("credit_ledger").insert({
    coach_id: session.coachId,
    package_questions: pkg,
    period_months: period,
    qty: -1,
    reason: "assign",
    student_id: studentId,
    prev_license_end: student.license_end_date,
    prev_plan_questions: student.plan_questions,
  });
  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

  const { error: uErr } = await supabaseAdmin
    .from("students")
    .update({ plan_questions: pkg, license_end_date: newEnd })
    .eq("id", studentId);
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, license_end_date: newEnd });
}
