import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("students")
    .select("id, name_surname, status, class_id, license_end_date, classes(class_name)")
    .eq("coach_id", session.coachId)
    .is("deleted_at", null)
    .order("name_surname");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ students: data });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await request.json();
  const nameSurname = String(body.name_surname || "").trim();
  if (!nameSurname) {
    return NextResponse.json({ error: "İsim gerekli" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("students")
    .insert({
      name_surname: nameSurname,
      coach_id: session.coachId,
      class_id: body.class_id || null,
      status: "active",
      license_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ student: data });
}
