import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

// Koça ait ya da sahibi tanımsız (eski) dersler
function ownerFilter(coachId: string) {
  return `coach_id.eq.${coachId},coach_id.is.null`;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 60) : "";
  if (!name) return NextResponse.json({ error: "Ders adı boş olamaz" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("lessons")
    .update({ name })
    .eq("id", params.id)
    .or(ownerFilter(session.coachId))
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lesson: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: lesson } = await supabaseAdmin
    .from("lessons")
    .select("id")
    .eq("id", params.id)
    .or(ownerFilter(session.coachId))
    .maybeSingle();
  if (!lesson) return NextResponse.json({ error: "Ders bulunamadı" }, { status: 404 });

  // Ödevler silinmez: ders ve konu bağlantıları kaldırılır ("Derssiz" klasörüne düşer)
  const { error: aErr } = await supabaseAdmin
    .from("assignments")
    .update({ lesson_id: null, topic_id: null })
    .eq("lesson_id", params.id)
    .eq("coach_id", session.coachId);
  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

  const { error: tErr } = await supabaseAdmin.from("topics").delete().eq("lesson_id", params.id);
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

  const { error } = await supabaseAdmin.from("lessons").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
