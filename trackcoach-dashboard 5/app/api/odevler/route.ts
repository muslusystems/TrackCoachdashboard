import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("assignments")
    .select(
      "id, title, description, assignment_type, drive_pdf_url, due_date, answer_key, created_at, student_assignments(count)"
    )
    .eq("coach_id", session.coachId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assignments: data });
}
