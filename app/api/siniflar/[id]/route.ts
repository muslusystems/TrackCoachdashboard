import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

// Sınıfı siler. Öğrenciler silinmez, "Sınıfsız" olur. Ödevlere dokunulmaz.
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { data: cls } = await supabaseAdmin
    .from("classes")
    .select("id")
    .eq("id", params.id)
    .eq("coach_id", session.coachId)
    .maybeSingle();
  if (!cls) return NextResponse.json({ error: "Sınıf bulunamadı" }, { status: 404 });

  const { error: sErr } = await supabaseAdmin
    .from("students")
    .update({ class_id: null })
    .eq("class_id", params.id)
    .eq("coach_id", session.coachId);
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

  const { error } = await supabaseAdmin
    .from("classes")
    .delete()
    .eq("id", params.id)
    .eq("coach_id", session.coachId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
