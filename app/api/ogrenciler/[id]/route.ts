import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

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
    .select("id, status, created_at, assignments(id, title, due_date, drive_pdf_url)")
    .eq("student_id", params.id)
    .order("created_at", { ascending: false });

  const { data: submissionsRaw, error: submissionsError } = await supabaseAdmin
    .from("submissions")
    .select("id, drive_photo_url, gemini_analysis, created_at, assignments(title)")
    .eq("student_id", params.id)
    .order("created_at", { ascending: false });

  if (assignedError || submissionsError) {
    return NextResponse.json(
      { error: assignedError?.message || submissionsError?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    student,
    assignedAssignments: assignedRaw || [],
    submissions: submissionsRaw || [],
  });
}
