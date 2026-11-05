import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type AtaSonuc =
  | { ok: true; className: string; created: boolean; studentName: string }
  | { ok: false; error: string; status: number };

/**
 * Bir öğrenciyi sınıfa ekler. Telegram ve dashboard aynı fonksiyonu kullanır.
 * - classId verilirse koça ait mevcut sınıfa ekler
 * - newName verilirse aynı adlı sınıf varsa onu kullanır, yoksa oluşturur
 * - ikisi de boşsa öğrenciyi sınıfsız yapar
 */
export async function assignStudentToClass(
  coachId: string,
  student: { id?: string; telegramId?: string },
  target: { classId?: string | null; newName?: string | null }
): Promise<AtaSonuc> {
  let q = supabaseAdmin.from("students").select("id, name_surname").eq("coach_id", coachId).is("deleted_at", null);
  if (student.id) q = q.eq("id", student.id);
  else if (student.telegramId) q = q.eq("telegram_id", student.telegramId);
  else return { ok: false, error: "Öğrenci belirtilmedi", status: 400 };
  const { data: st } = await q.limit(1);
  const s = st && st[0];
  if (!s) return { ok: false, error: "Öğrenci bulunamadı", status: 404 };

  let classId: string | null = null;
  let className = "Sınıfsız";
  let created = false;

  const newName = String(target.newName || "").trim().replace(/\s+/g, " ");
  if (newName) {
    if (newName.length > 40) return { ok: false, error: "Sınıf adı en fazla 40 karakter olabilir", status: 400 };
    const { data: all } = await supabaseAdmin.from("classes").select("id, class_name").eq("coach_id", coachId);
    const same = (all || []).find(
      (c: any) => String(c.class_name).toLocaleLowerCase("tr-TR") === newName.toLocaleLowerCase("tr-TR")
    );
    if (same) {
      classId = same.id;
      className = same.class_name;
    } else {
      const { data: ins, error } = await supabaseAdmin
        .from("classes")
        .insert({ class_name: newName, coach_id: coachId })
        .select("id, class_name")
        .single();
      if (error || !ins) return { ok: false, error: error?.message || "Sınıf oluşturulamadı", status: 500 };
      classId = ins.id;
      className = ins.class_name;
      created = true;
    }
  } else if (target.classId) {
    const { data: c } = await supabaseAdmin
      .from("classes")
      .select("id, class_name")
      .eq("id", target.classId)
      .eq("coach_id", coachId)
      .maybeSingle();
    if (!c) return { ok: false, error: "Sınıf bulunamadı", status: 404 };
    classId = c.id;
    className = c.class_name;
  }

  const { error: upErr } = await supabaseAdmin.from("students").update({ class_id: classId }).eq("id", s.id);
  if (upErr) return { ok: false, error: upErr.message, status: 500 };
  return { ok: true, className, created, studentName: s.name_surname };
}
