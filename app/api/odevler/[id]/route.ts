import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await request.json();
  const update: Record<string, string | null> = {};
  if (typeof body.title === "string") update.title = body.title;
  if (typeof body.description === "string") update.description = body.description;
  if (typeof body.answer_key === "string") update.answer_key = body.answer_key || null;
  if (typeof body.due_date === "string") update.due_date = body.due_date || null;

  const { data, error } = await supabaseAdmin
    .from("assignments")
    .update(update)
    .eq("id", params.id)
    .eq("coach_id", session.coachId) // kendi ödevi olmayanı güncelleyemesin
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assignment: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { error } = await supabaseAdmin
    .from("assignments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("coach_id", session.coachId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
