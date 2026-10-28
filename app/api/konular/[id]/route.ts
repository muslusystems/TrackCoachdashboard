import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

function ownTopic(id: string, coachId: string) {
  return supabaseAdmin
    .from("topics")
    .select("id")
    .eq("id", id)
    .or(`coach_id.eq.${coachId},coach_id.is.null`)
    .maybeSingle();
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { name } = await request.json();
  const clean = typeof name === "string" ? name.trim().slice(0, 60) : "";
  if (!clean) return NextResponse.json({ error: "Ad boş olamaz" }, { status: 400 });

  const { data: own } = await ownTopic(params.id, session.coachId);
  if (!own) return NextResponse.json({ error: "Konu bulunamadı" }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .from("topics")
    .update({ name: clean })
    .eq("id", params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ topic: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: own } = await ownTopic(params.id, session.coachId);
  if (!own) return NextResponse.json({ error: "Konu bulunamadı" }, { status: 404 });

  // Ödevler silinmez: sadece konu bağlantısı kalkar, "Konusuz" klasörüne düşerler.
  const { error: aErr } = await supabaseAdmin
    .from("assignments")
    .update({ topic_id: null })
    .eq("topic_id", params.id)
    .eq("coach_id", session.coachId);
  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

  const { error } = await supabaseAdmin.from("topics").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
