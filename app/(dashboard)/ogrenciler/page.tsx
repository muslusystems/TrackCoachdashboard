"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { avatarStyle, initials } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Student = {
  id: string;
  name_surname: string;
  status: string;
  class_id: string | null;
  classes: { class_name: string } | null;
};

type ClassOption = { id: string; class_name: string };

export default function OgrencilerPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [classId, setClassId] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function load() {
    setLoading(true);
    const [studentsRes, classesRes] = await Promise.all([
      fetch("/api/ogrenciler").then((r) => r.json()),
      fetch("/api/siniflar").then((r) => r.json()),
    ]);
    setStudents(studentsRes.students || []);
    setClasses(classesRes.classes || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const ogrenciSil = async (studentId: string) => {
      const onay = window.confirm("⚠️ Bu öğrenciyi silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz ve öğrencinin tüm ödev geçmişi de silinir.");
      
      if (onay) {
          try {
              const res = await fetch(`/api/ogrenciler/${studentId}`, {
                  method: 'DELETE',
              });

              if (!res.ok) {
                  throw new Error("Silme işlemi sunucu tarafından reddedildi.");
              }

              alert("Öğrenci başarıyla silindi.");
              load(); // Verileri yeniden çekip listeyi günceller
          } catch (error: any) {
              alert("Hata oluştu: " + error.message);
          }
      }
  };
  
  async function handleAdd() {
    setFormError("");
    if (!name.trim()) {
      setFormError("Öğrenci adını gir");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/ogrenciler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name_surname: name, class_id: classId || null }),
    });
    setSaving(false);
    if (!res.ok) {
      setFormError("Kaydedilemedi, tekrar dene.");
      return;
    }
    setName("");
    setClassId("");
    setOpen(false);
    load();
  }

  return (
    <div>
      <PageHeader
        icon={Users}
        title="Öğrenciler"
        description="Kayıtlı öğrencilerini ve ödev geçmişlerini buradan takip et."
        action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} /> Öğrenci ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni öğrenci ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-600">
                  Ad soyad
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="örn. Özlem Uslu"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-600">
                  Sınıf (opsiyonel)
                </label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm"
                >
                  <option value="">Sınıfsız</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.class_name}
                    </option>
                  ))}
                </select>
              </div>
              {formError && (
                <p className="text-sm text-pending-700">{formError}</p>
              )}
              <Button onClick={handleAdd} disabled={saving} className="w-full">
                {saving ? "Kaydediliyor…" : "Kaydet"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Kayıtlı öğrenciler ({students.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-ink-400">Yükleniyor…</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-ink-400">
              Henüz öğrencin yok. &quot;Öğrenci ekle&quot; ile başla, ya da admin
              bottan davet linki gönder.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
                  <th className="pb-2 font-medium">Ad soyad</th>
                  <th className="pb-2 font-medium">Sınıf</th>
                  <th className="pb-2 font-medium">Durum</th>
                  <th className="pb-2 font-medium text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-ink-50 transition-colors last:border-0 hover:bg-signal-50/60"
                  >
                    <td className="py-3 text-ink-900">
                      <Link
                        href={`/ogrenciler/${s.id}`}
                        className="flex items-center gap-3 font-medium hover:text-signal-600"
                      >
                        <span
                          className={
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold " +
                            avatarStyle(s.name_surname)
                          }
                        >
                          {initials(s.name_surname)}
                        </span>
                        {s.name_surname}
                      </Link>
                    </td>
                    <td className="py-3 text-ink-600">
                      {s.classes?.class_name || "—"}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-progress-100 px-2.5 py-1 text-xs font-medium text-progress-700"><span className="h-1.5 w-1.5 rounded-full bg-progress-500" />
                        {s.status === "active" ? "Aktif" : s.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button 
                        onClick={() => ogrenciSil(s.id)} 
                        className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                      >
                        Sil
                      </button>
                    </td>                  
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
