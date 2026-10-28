import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { evaluateStudent, type AlertStudent } from "@/lib/alertRules";

const dayKey = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });

export async function computeAlerts(coachId: string): Promise<AlertStudent[]> {
  const { data: students, error } = await supabaseAdmin
    .from("students")
    .select("id, name_surname, classes(class_name)")
    .eq("coach_id", coachId)
    .is("deleted_at", null)
    .order("name_surname");
  if (error) throw new Error(error.message);
  const list = students || [];
  if (list.length === 0) return [];
  const ids = list.map((s) => s.id);

  const [{ data: assigned, error: e1 }, { data: subs, error: e2 }] = await Promise.all([
    supabaseAdmin
      .from("student_assignments")
      .select("student_id, status, created_at, assignments(due_date, deleted_at)")
      .in("student_id", ids),
    supabaseAdmin
      .from("submissions")
      .select("student_id, score_data, gemini_analysis, created_at")
      .in("student_id", ids)
      .order("created_at", { ascending: false }),
  ]);
  if (e1 || e2) throw new Error((e1 || e2)!.message);

  const today = dayKey(new Date());
  return list.map((s) => {
    const mine = (assigned || [])
      .filter((a) => a.student_id === s.id)
      .map((a) => {
        const asg: any = Array.isArray(a.assignments) ? a.assignments[0] : a.assignments;
        return { status: a.status as string, created_at: a.created_at as string, due_date: asg?.due_date ?? null, deleted: !!asg?.deleted_at };
      })
      .filter((a) => !a.deleted);
    const cls: any = Array.isArray(s.classes) ? s.classes[0] : s.classes;
    return evaluateStudent(
      { id: s.id, name: s.name_surname, className: cls?.class_name ?? null },
      mine.map((a) => ({
        pending: a.status === "pending",
        createdDay: dayKey(a.created_at),
        dueDay: a.due_date ? dayKey(a.due_date) : null,
      })),
      (subs || []).filter((x) => x.student_id === s.id).map((x) => ({
        createdAt: x.created_at as string,
        score: x.score_data as any,
        analysis: x.gemini_analysis as string | null,
      })),
      today
    );
  });
}
