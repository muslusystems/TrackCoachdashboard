"use client";

import { useEffect, useState, useCallback } from "react";
import { UploadCloud, FileText, X, Plus } from "lucide-react";
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

type ClassOption = { id: string; class_name: string };
type StudentOption = { id: string; name_surname: string; class_id: string | null };
type LessonOption = { id: string; name: string };
type TopicOption = { id: string; name: string; lesson_id: string };

export default function OdevAtaPage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [coachId, setCoachId] = useState("");
  const [loading, setLoading] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [answerKey, setAnswerKey] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [targetType, setTargetType] = useState<"class" | "students">("class");
  const [classId, setClassId] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  // Ders ve Konu State'leri
  const [lessonId, setLessonId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [isLessonOpen, setIsLessonOpen] = useState(false);
  const [isTopicOpen, setIsTopicOpen] = useState(false);
  const [newLessonName, setNewLessonName] = useState("");
  const [newTopicName, setNewTopicName] = useState("");
  const [savingLesson, setSavingLesson] = useState(false);
  const [savingTopic, setSavingTopic] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function loadData() {
    try {
      const [studentsRes, classesRes, meRes, derslerRes, konularRes] = await Promise.all([
        fetch("/api/ogrenciler").then((r) => r.json()),
        fetch("/api/siniflar").then((r) => r.json()),
        fetch("/api/me").then((r) => r.json()),
        fetch("/api/dersler").then((r) => r.json()).catch(() => ({ lessons: [] })),
        fetch("/api/konular").then((r) => r.json()).catch(() => ({ topics: [] })),
      ]);
      setStudents(studentsRes.students || []);
      setClasses(classesRes.classes || []);
      setCoachId(meRes.coachId || "");
      setLessons(derslerRes.lessons || []);
      setTopics(konularRes.topics || []);
    } catch (error) {
      console.error("Veriler yüklenirken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }, []);

  function toggleStudent(id: string) {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleAddLesson() {
    if (!newLessonName.trim()) return;
    setSavingLesson(true);
    const res = await fetch("/api/dersler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newLessonName }),
    });
    setSavingLesson(false);
    if (res.ok) {
      const data = await res.json();
      setLessons([...lessons, data.lesson]);
      setLessonId(data.lesson.id); // Otomatik seç
      setTopicId(""); // Ders değiştiği için konuyu sıfırla
      setNewLessonName("");
      setIsLessonOpen(false);
    }
  }

  async function handleAddTopic() {
    if (!newTopicName.trim() || !lessonId) return;
    setSavingTopic(true);
    const res = await fetch("/api/konular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTopicName, lesson_id: lessonId }),
    });
    setSavingTopic(false);
    if (res.ok) {
      const data = await res.json();
      setTopics([...topics, data.topic]);
      setTopicId(data.topic.id); // Otomatik seç
      setNewTopicName("");
      setIsTopicOpen(false);
    }
  }

  // Seçilen derse ait konuları filtrele
  const filteredTopics = topics.filter((t) => t.lesson_id === lessonId);

  async function handleSubmit() {
    setResult(null);

    if (!file) {
      setResult({ ok: false, message: "Bir dosya seç." });
      return;
    }
    if (!title.trim()) {
      setResult({ ok: false, message: "Ödev başlığını gir." });
      return;
    }
    if (!lessonId) {
      setResult({ ok: false, message: "Lütfen bir ders seçin." });
      return;
    }
    if (!topicId) {
      setResult({ ok: false, message: "Lütfen bir konu seçin." });
      return;
    }
    if (targetType === "class" && !classId) {
      setResult({ ok: false, message: "Bir sınıf seç." });
      return;
    }
    if (targetType === "students" && selectedStudents.length === 0) {
      setResult({ ok: false, message: "En az bir öğrenci seç." });
      return;
    }

    setSubmitting(true);
    try {
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_ODEV_ATA_WEBHOOK_URL;
      const secret = process.env.NEXT_PUBLIC_TRACKCOACH_WEBHOOK_SECRET;
      if (!webhookUrl || !secret || !coachId) {
        throw new Error("Sunucu ayarları veya oturum bilgisi eksik.");
      }

      const formData = new FormData();
      formData.set("data", file);
      formData.set("coachId", coachId);
      formData.set("title", title);
      formData.set("description", description);
      formData.set("answerKey", answerKey);
      formData.set("assignmentType", "pdf");
      formData.set("dueDate", dueDate);
      formData.set("lessonId", lessonId);
      formData.set("topicId", topicId);
      formData.set("targetType", targetType);
      formData.set("classId", targetType === "class" ? classId : "");
      formData.set("studentIds", targetType === "students" ? JSON.stringify(selectedStudents) : "[]");

      if (answerFile) {
        formData.set("answerFile", answerFile);
      }

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "x-trackcoach-secret": secret },
        body: formData,
      });

      let data: { ok?: boolean; error?: string; assignedCount?: number } = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(`Sunucudan geçersiz yanıt geldi (durum: ${res.status}).`);
      }

      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "Bir şeyler ters gitti.");
      }

      setResult({
        ok: true,
        message: `Ödev ${data.assignedCount ?? ""} öğrenciye atandı.`,
      });
      
      // Formu temizle
      setFile(null);
      setAnswerFile(null);
      setTitle("");
      setDescription("");
      setAnswerKey("");
      setDueDate("");
      setSelectedStudents([]);
      setClassId("");
    } catch (err) {
      setResult({
        ok: false,
        message: err instanceof Error ? err.message : "Bir şeyler ters gitti.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-ink-900">
        Ödev Ata
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Dosya</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center rounded-md border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragActive
                ? "border-signal-400 bg-signal-50"
                : "border-ink-200 bg-ink-50"
            }`}
          >
            {file ? (
              <div className="flex items-center gap-3">
                <FileText size={24} className="text-signal-600" />
                <span className="text-sm text-ink-900">{file.name}</span>
                <button onClick={() => setFile(null)} aria-label="Kaldır">
                  <X size={16} className="text-ink-400 hover:text-ink-800" />
                </button>
              </div>
            ) : (
              <>
                <UploadCloud size={28} className="mb-2 text-ink-400" />
                <p className="text-sm text-ink-600">
                  Dosyayı buraya sürükle-bırak
                </p>
                <label className="mt-3 cursor-pointer text-sm font-medium text-signal-600 hover:text-signal-800">
                  ya da bilgisayardan seç
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Ödev bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* YENİ EKLENEN: Ders ve Konu Seçimi */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Ders Seçimi */}
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600">
                Ders
              </label>
              <div className="flex gap-2">
                <select
                  value={lessonId}
                  onChange={(e) => {
                    setLessonId(e.target.value);
                    setTopicId(""); // Ders değişince konuyu sıfırla
                  }}
                  className="flex h-10 flex-1 rounded-md border border-ink-200 bg-white px-3 text-sm"
                >
                  <option value="">Ders seç…</option>
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
                
                <Dialog open={isLessonOpen} onOpenChange={setIsLessonOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                      <Plus size={16} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Yeni Ders Ekle</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Input
                        value={newLessonName}
                        onChange={(e) => setNewLessonName(e.target.value)}
                        placeholder="örn. Matematik"
                      />
                      <Button onClick={handleAddLesson} disabled={savingLesson} className="w-full">
                        {savingLesson ? "Ekleniyor..." : "Ekle"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Konu Seçimi */}
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600">
                Konu
              </label>
              <div className="flex gap-2">
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  disabled={!lessonId}
                  className="flex h-10 flex-1 rounded-md border border-ink-200 bg-white px-3 text-sm disabled:bg-ink-50 disabled:text-ink-400"
                >
                  <option value="">Konu seç…</option>
                  {filteredTopics.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                
                <Dialog open={isTopicOpen} onOpenChange={setIsTopicOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" disabled={!lessonId}>
                      <Plus size={16} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Yeni Konu Ekle</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Input
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        placeholder="örn. Türev"
                      />
                      <Button onClick={handleAddTopic} disabled={savingTopic} className="w-full">
                        {savingTopic ? "Ekleniyor..." : "Ekle"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600">
              Başlık
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="örn. Türev Test 2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600">
              Açıklama (opsiyonel)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="örn. 1-15 arası soruları çöz"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600">
              Son teslim tarihi (opsiyonel)
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600">
              Cevap anahtarı (opsiyonel — öğrenciye asla gösterilmez)
            </label>
            <textarea
              value={answerKey}
              onChange={(e) => setAnswerKey(e.target.value)}
              placeholder="örn. 1-A, 2-C, 3-B, 4-D, 5-A ..."
              rows={4}
              className="flex w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-signal-400"
            />
            <p className="mt-1 text-xs text-ink-400">
              Bunu girersen, öğrenci fotoğrafını gönderdiğinde yapay zeka
              cevaplarını bu anahtarla karşılaştırıp doğru/yanlış sayısını
              hesaplar. Bu metin öğrenciye hiçbir zaman gösterilmez.
            </p>
          </div>
          
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-600">
              Cevap Dosyası Yükle (PDF/Görsel - Opsiyonel)
            </label>
            {answerFile ? (
              <div className="flex h-10 w-full items-center justify-between rounded-md border border-ink-200 bg-ink-50 px-3 py-2 text-sm text-ink-900">
                <span className="truncate">{answerFile.name}</span>
                <button
                  type="button"
                  onClick={() => setAnswerFile(null)}
                  className="ml-2 flex items-center justify-center text-ink-400 hover:text-ink-800"
                  aria-label="Cevap dosyasını kaldır"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <input
                type="file"
                onChange={(e) => setAnswerFile(e.target.files?.[0] || null)}
                className="flex h-10 w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm"
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Kime atanacak</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={targetType === "class"}
                onChange={() => setTargetType("class")}
              />
              Bir sınıfın tamamı
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={targetType === "students"}
                onChange={() => setTargetType("students")}
              />
              Seçili öğrenciler
            </label>
          </div>

          {loading ? (
            <p className="text-sm text-ink-400">Yükleniyor…</p>
          ) : targetType === "class" ? (
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm"
            >
              <option value="">Sınıf seç…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class_name}
                </option>
              ))}
            </select>
          ) : (
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {students.length === 0 && (
                <p className="text-sm text-ink-400">Henüz öğrencin yok.</p>
              )}
              {students.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-ink-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(s.id)}
                    onChange={() => toggleStudent(s.id)}
                  />
                  {s.name_surname}
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <p
          className={`mt-4 text-sm ${
            result.ok ? "text-progress-700" : "text-pending-700"
          }`}
        >
          {result.message}
        </p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-4 w-full"
      >
        {submitting ? "Atanıyor…" : "Ödevi Ata"}
      </Button>
    </div>
  );
}
