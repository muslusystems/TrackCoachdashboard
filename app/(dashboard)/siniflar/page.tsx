"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, GraduationCap, Users, UserPlus, ChevronDown, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
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

type ClassRow = {
  id: string;
  class_name: string;
  students: { count: number }[];
};

type StudentRow = {
  id: string;
  name_surname: string;
  class_id: string | null;
  classes: { class_name: string } | null;
};

export default function SiniflarPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Sınıfa öğrenci ekleme
  const [addTarget, setAddTarget] = useState<ClassRow | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");

  async function openAdd(c: ClassRow) {
    setAddTarget(c);
    setPicked(new Set());
    setAddError("");
    const res = await fetch("/api/ogrenciler").then((r) => r.json()).catch(() => ({ students: [] }));
    setStudents(res.students || []);
  }

  function togglePick(id: string) {
    setPicked((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function handleAddStudents() {
    if (!addTarget) return;
    if (!picked.size) {
      setAddError("En az bir öğrenci seç");
      return;
    }
    setAddSaving(true);
    setAddError("");
    const res = await fetch(`/api/siniflar/${addTarget.id}/ogrenciler`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentIds: Array.from(picked) }),
    });
    setAddSaving(false);
    if (!res.ok) {
      setAddError("Eklenemedi, tekrar dene.");
      return;
    }
    setAddTarget(null);
    load();
  }

  // Sınıfların öğrenci listeleri (silinmemiş öğrenciler)
  const [members, setMembers] = useState<StudentRow[]>([]);
  const [openClasses, setOpenClasses] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    const [res, st] = await Promise.all([
      fetch("/api/siniflar").then((r) => r.json()),
      fetch("/api/ogrenciler").then((r) => r.json()).catch(() => ({ students: [] })),
    ]);
    setClasses(res.classes || []);
    setMembers(st.students || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // 👇 SINIF SİLME FONKSİYONU EKLENDİ 👇
  const sinifSil = async (classId: string) => {
    const onay = window.confirm("⚠️ Bu sınıfı silmek istediğinize emin misiniz?\n\nİçindeki öğrenciler silinmeyecek, sadece 'Sınıfsız' durumuna düşecektir.");
    
    if (onay) {
        try {
            const res = await fetch(`/api/siniflar/${classId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error("Silme işlemi sunucu tarafından reddedildi.");
            }

            alert("Sınıf başarıyla silindi.");
            load(); // Sınıf kutularını günceller
        } catch (error: any) {
            alert("Hata oluştu: " + error.message);
        }
    }
  };

  async function handleAdd() {
    setFormError("");
    if (!name.trim()) {
      setFormError("Sınıf adını gir");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/siniflar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ class_name: name }),
    });
    setSaving(false);
    if (!res.ok) {
      setFormError("Kaydedilemedi, tekrar dene.");
      return;
    }
    setName("");
    setOpen(false);
    load();
  }

  return (
    <div>
      <PageHeader
        icon={GraduationCap}
        title="Sınıflar"
        description="Öğrencilerini sınıflara ayır, ödevi tüm sınıfa tek seferde ata."
        action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} /> Sınıf ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni sınıf ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-600">
                  Sınıf adı
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="örn. 9A"
                />
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

      {loading ? (
        <p className="text-sm text-ink-400">Yükleniyor…</p>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-ink-400">
            Henüz sınıfın yok. "Sınıf ekle" ile başla.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle>{c.class_name}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                {(() => {
                  const list = members.filter((m) => m.class_id === c.id);
                  const open = !!openClasses[c.id];
                  return (
                    <button
                      type="button"
                      disabled={list.length === 0}
                      onClick={() => setOpenClasses((p) => ({ ...p, [c.id]: !p[c.id] }))}
                      className="flex items-center gap-2 rounded-lg text-sm text-ink-600 enabled:hover:text-ink-900 disabled:cursor-default"
                      aria-expanded={open}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-50 text-signal-600">
                        <Users size={15} />
                      </span>
                      <span className={list.length ? "underline decoration-dotted underline-offset-4" : ""}>
                        {list.length} öğrenci
                      </span>
                      {list.length > 0 && (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                    </button>
                  );
                })()}
                <div className="flex items-center gap-1">
                <button
                  onClick={() => openAdd(c)}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-signal-600 transition-colors hover:bg-signal-50 hover:text-signal-800"
                >
                  <UserPlus size={13} /> Öğrenci ekle
                </button>
                <button 
                  onClick={() => sinifSil(c.id)} 
                  className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  Sil
                </button>
                </div>
              </CardContent>
              {openClasses[c.id] && (
                <ul className="mx-6 mb-4 space-y-1 border-t border-ink-100 pt-3">
                  {members
                    .filter((m) => m.class_id === c.id)
                    .map((m) => (
                      <li key={m.id}>
                        <Link
                          href={`/ogrenciler/${m.id}`}
                          className="block rounded-md px-2 py-1.5 text-sm text-ink-900 hover:bg-signal-50"
                        >
                          {m.name_surname}
                        </Link>
                      </li>
                    ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!addTarget} onOpenChange={(o) => !o && setAddTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{addTarget ? `${addTarget.class_name} sınıfına öğrenci ekle` : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {students.filter((s) => s.class_id !== addTarget?.id).length === 0 ? (
              <p className="text-sm text-ink-400">Eklenecek öğrenci yok. Tüm öğrencilerin zaten bu sınıfta.</p>
            ) : (
              <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border border-ink-100 p-2">
                {students
                  .filter((s) => s.class_id !== addTarget?.id)
                  .map((s) => (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-signal-50/60"
                    >
                      <span className="flex items-center gap-2 text-ink-900">
                        <input
                          type="checkbox"
                          checked={picked.has(s.id)}
                          onChange={() => togglePick(s.id)}
                        />
                        {s.name_surname}
                      </span>
                      <span className="text-xs text-ink-400">{s.classes?.class_name || "Sınıfsız"}</span>
                    </label>
                  ))}
              </div>
            )}
            {addError && <p className="text-sm text-pending-700">{addError}</p>}
            <Button onClick={handleAddStudents} disabled={addSaving} className="w-full">
              {addSaving ? "Ekleniyor…" : `Seçilenleri ekle${picked.size ? ` (${picked.size})` : ""}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
