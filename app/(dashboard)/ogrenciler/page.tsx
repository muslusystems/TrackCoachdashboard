"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Check, Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { avatarStyle, initials } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState<"" | "link" | "msg">("");

  useEffect(() => {
    fetch("/api/davet-linki")
      .then((r) => r.json())
      .then((j) => setInviteLink(j.link || ""))
      .catch(() => {});
  }, []);

  const inviteMessage = `Merhaba! Ödev takibi için Telegram botuna bu linkten giriş yap: ${inviteLink}\n\nLinke tıkla, "Başlat"a bas ve adını soyadını yaz.`;

  async function kopyala(text: string, which: "link" | "msg") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      window.prompt("Kopyala:", text);
    }
  }

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

  // Öğrencinin sınıfını değiştir (mevcut sınıf, sınıfsız ya da yeni sınıf oluştur)
  async function sinifDegistir(studentId: string, value: string) {
    let body: Record<string, unknown>;
    if (value === "__yeni") {
      const ad = window.prompt("Yeni sınıfın adı (örn. 9. Sınıf):");
      if (!ad || !ad.trim()) return;
      body = { new_class_name: ad.trim() };
    } else {
      body = { class_id: value || null };
    }
    const res = await fetch(`/api/ogrenciler/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert("Sınıf değiştirilemedi: " + (j.error || "hata"));
      return;
    }
    load();
  }

  const ogrenciSil = async (studentId: string) => {
      const onay = window.confirm("⚠️ Bu öğrenciyi silmek istediğinize emin misiniz?\n\nÖğrenci listeden kaldırılır; geçmiş ödev ve teslim kayıtları saklanır.");
      
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
              <DialogTitle>Öğrenci nasıl eklenir?</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm text-ink-600">
              <p>
                Öğrenciler Telegram üzerinden senin davet linkinle kayıt olur.
                Aşağıdaki mesajı öğrencine gönder; öğrenci linke tıklayıp
                adını yazınca listende görünür.
              </p>
              <div className="break-all rounded-md border border-ink-200 bg-ink-50 p-3 text-xs text-ink-900">
                {inviteLink || "Yükleniyor…"}
              </div>
              <Button
                variant="secondary"
                className="w-full"
                disabled={!inviteLink}
                onClick={() => kopyala(inviteLink, "link")}
              >
                {copied === "link" ? <Check size={16} /> : <Copy size={16} />}{" "}
                {copied === "link" ? "Kopyalandı" : "Linki kopyala"}
              </Button>
              <Button
                className="w-full"
                disabled={!inviteLink}
                onClick={() => kopyala(inviteMessage, "msg")}
              >
                {copied === "msg" ? <Check size={16} /> : <Copy size={16} />}{" "}
                {copied === "msg" ? "Kopyalandı" : "Öğrenciye gönderilecek mesajı kopyala"}
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
              Henüz öğrencin yok. &quot;Öğrenci ekle&quot; butonuna basıp Telegram davet
              linkini öğrencine gönder.
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
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={
                            "text-sm " + (s.class_id ? "font-medium text-ink-900" : "font-medium text-pending-700")
                          }
                        >
                          {s.classes?.class_name || "Sınıfsız"}
                        </span>
                        <select
                          value="__none"
                          onChange={(e) => sinifDegistir(s.id, e.target.value)}
                          aria-label={`${s.name_surname} için sınıf değiştir`}
                          className="h-8 cursor-pointer rounded-md border border-ink-200 bg-white px-2 text-xs font-medium text-signal-600 hover:bg-signal-50"
                        >
                          <option value="__none" disabled hidden>
                            Sınıf değiştir
                          </option>
                          {s.class_id && <option value="">Sınıfsız yap</option>}
                          {classes
                            .filter((c) => c.id !== s.class_id)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.class_name}
                              </option>
                            ))}
                          <option value="__yeni">➕ Yeni sınıf oluştur…</option>
                        </select>
                      </div>
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
