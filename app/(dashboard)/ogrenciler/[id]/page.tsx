"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ChevronDown, ChevronRight, Folder } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { avatarStyle, initials } from "@/lib/utils";

type AssignedItem = {
  id: string;
  status: string;
  created_at: string;
  class_id?: string | null;
  class_name?: string | null;
  assignments: { id: string; title: string; due_date: string | null; drive_pdf_url: string | null; lesson_name?: string | null; topic_name?: string | null } | null;
};

type SubmissionItem = {
  id: string;
  assignment_id: string | null;
  score_data: { correct_count?: number; wrong_count?: number } | null;
  drive_photo_url: string | null;
  gemini_analysis: string | null;
  created_at: string;
  assignments: { title: string } | null;
};

type StudentDetail = {
  student: { id: string; name_surname: string; status: string; class_id?: string | null; classes: { class_name: string } | null };
  assignedAssignments: AssignedItem[];
  submissions: SubmissionItem[];
};

export default function OgrenciDetayPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Klasör açık/kapalı: varsayılandan farkı tutulur
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`/api/ogrenciler/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.error) setError(res.error);
        else setData(res);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="text-sm text-ink-400">Yükleniyor…</p>;
  if (error || !data)
    return <p className="text-sm text-pending-700">{error || "Öğrenci bulunamadı."}</p>;

  const renderItem = (a: AssignedItem) => {
              // 1. Bu ödeve ait TÜM cevapları filtrele (Eşleştirmeyi ödev başlığından yapıyoruz)
              const odevCevaplari = data.submissions.filter(
                (s) =>
                  s.assignment_id && a.assignments?.id
                    ? s.assignment_id === a.assignments.id
                    : s.assignments?.title === a.assignments?.title
              );

              // 2. Mükerrer cevapları önlemek için listeyi tarihe göre sırala ve EN SON (en güncel) olanı al
              odevCevaplari.sort((x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime());
              const cevap = odevCevaplari.length > 0 ? odevCevaplari[odevCevaplari.length - 1] : null;

              // 3. Yapay zeka JSON'ını temizle
              let analiz = null;
              if (cevap && cevap.gemini_analysis) {
                try {
                  // Olası markdown işaretlerini temizleyerek güvenli parse yap
                  const cleaned = cevap.gemini_analysis.replace(/```json/gi, "").replace(/```/g, "").trim();
                  analiz = JSON.parse(cleaned);
                } catch (e) {
                  // Hata olursa null bırak, aşağıda ham metni basacak
                }
              }

              return (
                <div
                  key={a.id}
                  className="rounded-xl border border-ink-100 bg-white p-4 text-sm shadow-card"
                >
                  {/* Ödev Başlığı ve Durumu */}
                  <div className="flex items-center justify-between border-b border-ink-50 pb-3 mb-3 gap-2">
                    <div>
                      <p className="font-medium text-lg text-ink-900">
                        {a.assignments?.title || "(silinmiş ödev)"}
                      </p>
                      {(a.assignments?.lesson_name || a.assignments?.topic_name) && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {a.assignments?.lesson_name && (
                            <span className="rounded-full bg-signal-50 px-2.5 py-0.5 text-xs font-medium text-signal-700">
                              {a.assignments.lesson_name}
                            </span>
                          )}
                          {a.assignments?.topic_name && (
                            <span className="rounded-full bg-ink-50 px-2.5 py-0.5 text-xs font-medium text-ink-600">
                              {a.assignments.topic_name}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="mt-1 flex items-center gap-3 text-xs text-ink-400">
                        {a.assignments?.due_date && <span>Son tarih: {new Date(a.assignments.due_date).toLocaleDateString("tr-TR")}</span>}
                        {a.assignments?.drive_pdf_url && (
                          <a
                            href={a.assignments.drive_pdf_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-signal-600 hover:text-signal-800"
                          >
                            Ödev Dosyası <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                        a.status === "pending"
                          ? "bg-pending-100 text-pending-700"
                          : "bg-progress-100 text-progress-700"
                      }`}
                    >
                      {a.status === "pending" ? "⏳ Bekliyor" : "✅ Teslim Edildi"}
                    </span>
                  </div>

                  {/* Varsa Cevap ve Analiz Kutusu */}
                  {cevap ? (
                    <div className="mt-2 rounded bg-ink-50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-ink-700">Yapay Zeka Analizi:</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-ink-400">
                            Teslim: {new Date(cevap.created_at).toLocaleString("tr-TR")}
                          </span>
                          {cevap.drive_photo_url && cevap.drive_photo_url.startsWith("http") && (
                            <a
                              href={cevap.drive_photo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex shrink-0 items-center gap-1 text-xs text-signal-600 hover:text-signal-800"
                            >
                              Fotoğraf <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      </div>
                      {(cevap.score_data || analiz) && (
                        <div className="mb-2 flex gap-2 text-xs font-semibold">
                          <span className="rounded-full bg-progress-100 px-2.5 py-1 text-progress-700">
                            ✅ Doğru: {cevap.score_data?.correct_count ?? analiz?.correct_count ?? 0}
                          </span>
                          <span className="rounded-full bg-pending-100 px-2.5 py-1 text-pending-700">
                            ❌ Yanlış: {cevap.score_data?.wrong_count ?? analiz?.wrong_count ?? 0}
                          </span>
                        </div>
                      )}
                      <p className="text-ink-700 text-sm whitespace-pre-wrap leading-relaxed">
                        {analiz ? analiz.comment : cevap.gemini_analysis}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-ink-400 italic">Öğrenci henüz bu ödevi yanıtlamadı.</p>
                  )}
                </div>
              );
  };

  // Sınıf > Ders klasörleri (sınıf = ödev atandığı andaki sınıf)
  const NONE = "__none";
  const currentKey = data.student.class_id || NONE;
  type LessonGroup = { key: string; name: string; items: AssignedItem[] };
  type ClassGroup = { key: string; name: string; latest: number; lessons: LessonGroup[]; count: number };
  const classMap = new Map<string, ClassGroup>();
  data.assignedAssignments.forEach((a) => {
    const ck = a.class_id && a.class_name ? a.class_id : NONE;
    if (!classMap.has(ck)) classMap.set(ck, { key: ck, name: ck === NONE ? "Sınıfsız" : (a.class_name as string), latest: 0, lessons: [], count: 0 });
    const g = classMap.get(ck)!;
    g.count++;
    g.latest = Math.max(g.latest, new Date(a.created_at).getTime());
    const lk = a.assignments?.lesson_name || NONE;
    let l = g.lessons.find((x) => x.key === lk);
    if (!l) { l = { key: lk, name: lk === NONE ? "Derssiz" : lk, items: [] }; g.lessons.push(l); }
    l.items.push(a);
  });
  const classGroups = Array.from(classMap.values()).sort((x, y) => {
    if (x.key === currentKey) return -1;
    if (y.key === currentKey) return 1;
    if (x.key === NONE) return 1;
    if (y.key === NONE) return -1;
    return y.latest - x.latest;
  });
  classGroups.forEach((g) => g.lessons.sort((x, y) => (x.key === NONE ? 1 : y.key === NONE ? -1 : x.name.localeCompare(y.name, "tr"))));
  const isOpen = (key: string, def: boolean) => (flipped[key] ? !def : def);
  const toggle = (key: string) => setFlipped((f) => ({ ...f, [key]: !f[key] }));

  return (
    <div>
      <Link
        href="/ogrenciler"
        className="mb-4 flex items-center gap-1 text-sm text-ink-400 hover:text-ink-800"
      >
        <ArrowLeft size={14} /> Öğrencilere dön
      </Link>

      <div className="mb-8 flex flex-wrap items-center gap-5 rounded-card bg-gradient-to-r from-night-900 via-night-800 to-signal-800 p-6 shadow-card">
        <span
          className={
            "flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-semibold " +
            avatarStyle(data.student.name_surname)
          }
        >
          {initials(data.student.name_surname)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold text-white">
            {data.student.name_surname}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-signal-200">
            <span>{data.student.classes?.class_name || "Sınıfsız"}</span>
            <span className="rounded-full bg-white/[0.12] px-2.5 py-0.5 text-xs font-medium text-white">
              {data.student.status === "active" ? "Aktif" : data.student.status}
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl bg-white/[0.1] px-4 py-2 text-center">
            <p className="font-display text-xl font-semibold text-white">
              {data.assignedAssignments.filter((x) => x.status !== "pending").length}
              <span className="text-signal-300">/{data.assignedAssignments.length}</span>
            </p>
            <p className="text-xs text-signal-200">teslim edilen ödev</p>
          </div>
        </div>
      </div>

      {/* Yenilenmiş Tekli ve Birleşik Ödev Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Ödev Geçmişi ve Analizler ({data.assignedAssignments.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.assignedAssignments.length === 0 ? (
            <p className="text-sm text-ink-400">Henüz ödev atanmamış.</p>
          ) : (
            classGroups.map((g, gi) => {
              const gKey = "c:" + g.key;
              const open = isOpen(gKey, g.key === currentKey || (gi === 0 && !classMap.has(currentKey)));
              return (
                <div key={g.key} className="rounded-xl border border-ink-100">
                  <button
                    type="button"
                    onClick={() => toggle(gKey)}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left"
                  >
                    {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <Folder size={16} className="text-signal-600" />
                    <span className="font-medium text-ink-900">{g.name}</span>
                    {g.key === currentKey && g.key !== NONE && (
                      <span className="rounded-full bg-signal-50 px-2 py-0.5 text-xs font-medium text-signal-700">Şu anki sınıf</span>
                    )}
                    <span className="ml-auto text-xs text-ink-400">{g.count} ödev</span>
                  </button>
                  {open && (
                    <div className="space-y-3 border-t border-ink-100 p-3">
                      {g.lessons.map((l) => {
                        const lKey = "l:" + g.key + ":" + l.key;
                        const lOpen = isOpen(lKey, true);
                        return (
                          <div key={l.key}>
                            <button
                              type="button"
                              onClick={() => toggle(lKey)}
                              className="mb-2 flex w-full items-center gap-2 text-left text-sm font-semibold text-ink-700"
                            >
                              {lOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              {l.name}
                              <span className="text-xs font-normal text-ink-400">({l.items.length})</span>
                            </button>
                            {lOpen && <div className="space-y-4">{l.items.map((a) => renderItem(a))}</div>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
