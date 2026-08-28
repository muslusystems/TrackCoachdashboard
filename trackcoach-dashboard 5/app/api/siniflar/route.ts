import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("classes")
    .select("id, class_name, created_at, students(count)")
    .eq("coach_id", session.coachId)
    .order("class_name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ classes: data });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await request.json();
  const className = String(body.class_name || "").trim();
  if (!className) {
    return NextResponse.json({ error: "Sınıf adı gerekli" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("classes")
    .insert({ class_name: className, coach_id: session.coachId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ class: data });
}
