import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { parseScore } from "@/lib/scoring";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("assignments")
    .select(
      "id, title, description, assignment_type, drive_pdf_url, due_date, answer_key, answer_key_file_url, lesson_id, topic_id, created_at, student_assignments(id, status, student_id, students(name_surname))"
    )
    .eq("coach_id", session.coachId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Ödev bazında teslim sonuçları (öğrenci başına en son teslim)
  const ids = (data || []).map((a) => a.id);
  const resultsByAssignment: Record<string, any[]> = {};
  if (ids.length > 0) {
    const { data: subs, error: sErr } = await supabaseAdmin
      .from("submissions")
      .select("assignment_id, student_id, score_data, gemini_analysis, created_at")
      .in("assignment_id", ids)
      .order("created_at", { ascending: false });
    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
    const seen = new Set<string>();
    for (const x of subs || []) {
      const key = x.assignment_id + ":" + x.student_id;
      if (seen.has(key)) continue;
      seen.add(key);
      const sc = parseScore(x.score_data as any, x.gemini_analysis as string | null);
      (resultsByAssignment[x.assignment_id] ||= []).push({
        student_id: x.student_id,
        created_at: x.created_at,
        correct: sc?.correct ?? null,
        wrong: sc?.wrong ?? null,
        wrong_questions: sc?.wrongQuestions ?? [],
      });
    }
  }

  const assignments = (data || []).map((a) => ({ ...a, results: resultsByAssignment[a.id] || [] }));
  return NextResponse.json({ assignments });
}
