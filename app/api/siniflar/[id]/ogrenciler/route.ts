import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

// Seçilen öğrencileri bu sınıfa taşır (koça ait sınıf ve öğrenciler)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.studentIds) ? body.studentIds.filter((x: unknown) => typeof x === "string") : [];
  if (!ids.length) return NextResponse.json({ error: "Öğrenci seçilmedi" }, { status: 400 });

  const { data: cls } = await supabaseAdmin
    .from("classes")
    .select("id")
    .eq("id", params.id)
    .eq("coach_id", session.coachId)
    .maybeSingle();
  if (!cls) return NextResponse.json({ error: "Sınıf bulunamadı" }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .from("students")
    .update({ class_id: params.id })
    .in("id", ids)
    .eq("coach_id", session.coachId)
    .is("deleted_at", null)
    .select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, moved: (data || []).length });
}
