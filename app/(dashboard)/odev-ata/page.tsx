"use client";

import { useEffect, useState, useCallback } from "react";
import { UploadCloud, FileText, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ClassOption = { id: string; class_name: string };
type StudentOption = { id: string; name_surname: string; class_id: string | null };

export default function OdevAtaPage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [targetType, setTargetType] = useState<"class" | "students">("class");
  const [classId, setClassId] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null
  );

  useEffect(() => {
    async function load() {
      const [studentsRes, classesRes] = await Promise.all([
        fetch("/api/ogrenciler").then((r) => r.json()),
        fetch("/api/siniflar").then((r) => r.json()),
      ]);
      setStudents(studentsRes.students || []);
      setClasses(classesRes.classes || []);
      setLoading(false);
    }
    load();
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
    if (targetType === "class" && !classId) {
      setResult({ ok: false, message: "Bir sınıf seç." });
      return;
    }
    if (targetType === "students" && selectedStudents.length === 0) {
      setResult({ ok: false, message: "En az bir öğrenci seç." });
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.set("data", file);
    formData.set("title", title);
    formData.set("description", description);
    formData.set("assignmentType", "pdf");
    formData.set("dueDate", dueDate);
    formData.set("targetType", targetType);
    formData.set("classId", targetType === "class" ? classId : "");
    formData.set(
      "studentIds",
      targetType === "students" ? JSON.stringify(selectedStudents) : "[]"
    );

    const res = await fetch("/api/odev-ata", { method: "POST", body: formData });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok || data.ok === false) {
      setResult({ ok: false, message: data.error || "Bir şeyler ters gitti." });
      return;
    }

    setResult({
      ok: true,
      message: `Ödev ${data.assignedCount ?? ""} öğrenciye atandı.`,
    });
    setFile(null);
    setTitle("");
    setDescription("");
    setDueDate("");
    setSelectedStudents([]);
    setClassId("");
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
        <CardContent className="space-y-3">
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
