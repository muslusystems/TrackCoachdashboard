"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          Öğrenciler
        </h1>
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
      </div>

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
                <tr className="border-b border-ink-100 text-left text-ink-400">
                  <th className="pb-2 font-medium">Ad soyad</th>
                  <th className="pb-2 font-medium">Sınıf</th>
                  <th className="pb-2 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-ink-50 last:border-0 hover:bg-ink-50"
                  >
                    <td className="py-3 text-ink-900">
                      <Link
                        href={`/ogrenciler/${s.id}`}
                        className="hover:text-signal-600 hover:underline"
                      >
                        {s.name_surname}
                      </Link>
                    </td>
                    <td className="py-3 text-ink-600">
                      {s.classes?.class_name || "—"}
                    </td>
                    <td className="py-3">
                      <span className="rounded-full bg-progress-100 px-2 py-0.5 text-xs font-medium text-progress-700">
                        {s.status === "active" ? "Aktif" : s.status}
                      </span>
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
