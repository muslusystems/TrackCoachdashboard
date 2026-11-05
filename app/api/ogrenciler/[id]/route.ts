import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { assignStudentToClass } from "@/lib/sinifAta";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: student, error: studentError } = await supabaseAdmin
    .from("students")
    .select("id, name_surname, status, class_id, classes(class_name)")
    .eq("id", params.id)
    .eq("coach_id", session.coachId)
    .single();

  if (studentError || !student) {
    return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });
  }

  const { data: assignedRaw, error: assignedError } = await supabaseAdmin
    .from("student_assignments")
    .select("id, status, created_at, assignments(id, title, due_date, drive_pdf_url, lesson_id, topic_id)")
    .eq("student_id", params.id)
    .order("created_at", { ascending: false });

  const { data: submissionsRaw, error: submissionsError } = await supabaseAdmin
    .from("submissions")
    .select("id, assignment_id, drive_photo_url, gemini_analysis, score_data, created_at, assignments(title)")
    .eq("student_id", params.id)
    .order("created_at", { ascending: false });

  if (assignedError || submissionsError) {
    return NextResponse.json(
      { error: assignedError?.message || submissionsError?.message },
      { status: 500 }
    );
  }

  // Ders ve konu adlarını ödevlere ekle
  const assigned: any[] = assignedRaw || [];
  const lessonIds = Array.from(new Set(assigned.map((a) => a.assignments?.lesson_id).filter(Boolean)));
  const topicIds = Array.from(new Set(assigned.map((a) => a.assignments?.topic_id).filter(Boolean)));
  const lessonName = new Map<string, string>();
  const topicName = new Map<string, string>();
  if (lessonIds.length) {
    const { data } = await supabaseAdmin.from("lessons").select("id, name").in("id", lessonIds);
    (data || []).forEach((l: any) => lessonName.set(l.id, l.name));
  }
  if (topicIds.length) {
    const { data } = await supabaseAdmin.from("topics").select("id, name").in("id", topicIds);
    (data || []).forEach((t: any) => topicName.set(t.id, t.name));
  }
  const assignedWithNames = assigned.map((a) =>
    a.assignments
      ? {
          ...a,
          assignments: {
            ...a.assignments,
            lesson_name: lessonName.get(a.assignments.lesson_id) || null,
            topic_name: topicName.get(a.assignments.topic_id) || null,
          },
        }
      : a
  );

  return NextResponse.json({
    student,
    assignedAssignments: assignedWithNames,
    submissions: submissionsRaw || [],
  });
}

// Öğrencinin sınıfını değiştir: { class_id } | { new_class_name } | { class_id: null } (sınıfsız)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  const r = await assignStudentToClass(
    session.coachId,
    { id: params.id },
    { classId: body.class_id || null, newName: body.new_class_name || null }
  );
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ ok: true, className: r.className, created: r.created });
}
