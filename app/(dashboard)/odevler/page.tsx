"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, ExternalLink, KeyRound, Folder, ChevronRight, ChevronDown, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  assignment_type: string | null;
  drive_pdf_url: string | null;
  due_date: string | null;
  answer_key: string | null;
  lesson_id: string | null;
  topic_id: string | null;
  created_at: string;
  student_assignments: {
    id: string;
    status: string;
    student_id: string;
    students: { name_surname: string } | null;
  }[];
};

type Lesson = { id: string; name: string };
type Topic = { id: string; name: string; lesson_id: string };

const NONE = "_none";

export default function OdevlerPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<Assignment | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAnswerKey, setEditAnswerKey] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lessonFolder, setLessonFolder] = useState<string | null>(null);
  const [topicFolder, setTopicFolder] = useState<string | null>(null);
  const [openStudents, setOpenStudents] = useState<Record<string, boolean>>({});
  const [renameTarget, setRenameTarget] = useState<{ kind: "lesson" | "topic"; id: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);
  const [renameError, setRenameError] = useState("");
  const [editLessonId, setEditLessonId] = useState("");
  const [editTopicId, setEditTopicId] = useState("");

  async function load() {
    setLoading(true);
    const [res, dRes, kRes] = await Promise.all([
      fetch("/api/odevler").then((r) => r.json()),
      fetch("/api/dersler").then((r) => r.json()).catch(() => ({ lessons: [] })),
      fetch("/api/konular").then((r) => r.json()).catch(() => ({ topics: [] })),
    ]);
    setAssignments(res.assignments || []);
    setLessons(dRes.lessons || []);
    setTopics(kRes.topics || []);
    setLoading(false);
  }

  const lessonIds = new Set(lessons.map((l) => l.id));
  const topicIds = new Set(topics.map((t) => t.id));
  const lessonOf = (a: Assignment) =>
    a.lesson_id && lessonIds.has(a.lesson_id) ? a.lesson_id : NONE;
  const topicOf = (a: Assignment) =>
    a.topic_id && topicIds.has(a.topic_id) ? a.topic_id : NONE;

  useEffect(() => {
    load();
  }, []);

  function openEdit(a: Assignment) {
    setEditing(a);
    setEditTitle(a.title || "");
    setEditDescription(a.description || "");
    setEditAnswerKey(a.answer_key || "");
    setEditDueDate(a.due_date || "");
    setEditLessonId(a.lesson_id && lessonIds.has(a.lesson_id) ? a.lesson_id : "");
    setEditTopicId(a.topic_id && topicIds.has(a.topic_id) ? a.topic_id : "");
    setFormError("");
  }

  async function handleSave() {
    if (!editing) return;
    if (!editTitle.trim()) {
      setFormError("Başlık boş olamaz.");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/odevler/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        description: editDescription,
        answer_key: editAnswerKey,
        due_date: editDueDate,
        lesson_id: editLessonId,
        topic_id: editTopicId,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setFormError("Kaydedilemedi, tekrar dene.");
      return;
    }
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/odevler/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    }
  }

  function openRename(kind: "lesson" | "topic", id: string, name: string) {
    setRenameTarget({ kind, id });
    setRenameValue(name);
    setRenameError("");
  }

  async function submitRename() {
    if (!renameTarget) return;
    if (!renameValue.trim()) {
      setRenameError("Ad boş olamaz.");
      return;
    }
    setRenameSaving(true);
    const url = (renameTarget.kind === "lesson" ? "/api/dersler/" : "/api/konular/") + renameTarget.id;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue }),
    });
    setRenameSaving(false);
    if (!res.ok) {
      setRenameError("Kaydedilemedi, tekrar dene.");
      return;
    }
    setRenameTarget(null);
    load();
  }

  async function deleteFolder(kind: "lesson" | "topic", id: string, name: string, count: number) {
    const what = kind === "lesson" ? "dersi" : "konuyu";
    const detail =
      kind === "lesson"
        ? "Dersin konuları silinir. İçindeki ödevler silinmez, \"Derssiz\" klasörüne taşınır."
        : "İçindeki ödevler silinmez, \"Konusuz\" klasörüne taşınır.";
    if (!window.confirm(`"${name}" ${what} silmek istediğine emin misin?\n\n${count} ödev etkilenecek. ${detail}`)) return;
    const url = (kind === "lesson" ? "/api/dersler/" : "/api/konular/") + id;
    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) {
      window.alert("Silinemedi, tekrar dene.");
      return;
    }
    if (kind === "lesson") {
      setLessonFolder(null);
      setTopicFolder(null);
    } else {
      setTopicFolder(null);
    }
    load();
  }

  function folderCard(
    key: string,
    name: string,
    count: number,
    onClick: () => void,
    manage?: { onRename: () => void; onDelete: () => void }
  ) {
    return (
      <div key={key} className="group relative">
      <button
        onClick={onClick}
        className="group flex w-full items-center gap-3 rounded-card border border-ink-100 bg-white p-4 pr-24 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-signal-200"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-signal-50 text-signal-600 transition-colors group-hover:bg-signal-100">
          <Folder size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink-900">{name}</p>
          <p className="text-xs text-ink-400">{count} ödev</p>
        </div>
      </button>
      {manage ? (
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
          <button
            onClick={manage.onRename}
            aria-label={`${name} adını değiştir`}
            title="Adını değiştir"
            className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-signal-50 hover:text-signal-600"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={manage.onDelete}
            aria-label={`${name} sil`}
            title="Sil"
            className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ) : (
        <ChevronRight size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-400" />
      )}
      </div>
    );
  }

  function renderBreadcrumb() {
    if (lessonFolder === null) return null;
    const lessonName = lessonFolder === NONE ? "Derssiz" : lessons.find((l) => l.id === lessonFolder)?.name || "Ders";
    const topicName =
      topicFolder === null || lessonFolder === NONE
        ? null
        : topicFolder === NONE
        ? "Konusuz"
        : topics.find((t) => t.id === topicFolder)?.name || "Konu";
    return (
      <div className="mb-4 flex flex-wrap items-center gap-1 text-sm text-ink-600">
        <button
          className="hover:text-ink-900 hover:underline"
          onClick={() => {
            setLessonFolder(null);
            setTopicFolder(null);
          }}
        >
          Dersler
        </button>
        <ChevronRight size={14} className="text-ink-400" />
        {topicName ? (
          <button className="hover:text-ink-900 hover:underline" onClick={() => setTopicFolder(null)}>
            {lessonName}
          </button>
        ) : (
          <span className="font-medium text-ink-900">{lessonName}</span>
        )}
        {topicName && (
          <>
            <ChevronRight size={14} className="text-ink-400" />
            <span className="font-medium text-ink-900">{topicName}</span>
          </>
        )}
      </div>
    );
  }

  function renderAssignment(a: Assignment) {
    const list = a.student_assignments || [];
    const delivered = list.filter((x) => x.status !== "pending").length;
    const isOpen = !!openStudents[a.id];
    return (
      <Card key={a.id}>
        <CardContent className="py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-ink-900">{a.title}</p>
                {a.answer_key && (
                  <span title="Cevap anahtarı tanımlı">
                    <KeyRound size={14} className="text-progress-500" />
                  </span>
                )}
              </div>
              {a.description && (
                <p className="mt-0.5 truncate text-sm text-ink-600">{a.description}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-400">
                <span>{list.length} öğrenciye atandı</span>
                {list.length > 0 && (
                  <button
                    onClick={() => setOpenStudents((p) => ({ ...p, [a.id]: !p[a.id] }))}
                    className="flex items-center gap-1 rounded border border-ink-200 px-2 py-0.5 text-ink-600 hover:bg-ink-50"
                  >
                    {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    {isOpen ? "Gizle" : "Göster"}
                  </button>
                )}
                <span className="font-medium text-progress-700">
                  {delivered}/{list.length} öğrenci teslim etti
                </span>
                {a.due_date && <span>Son tarih: {a.due_date}</span>}
                <span>{new Date(a.created_at).toLocaleDateString("tr-TR")}</span>
                {a.drive_pdf_url && (
                  <a
                    href={a.drive_pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-signal-600 hover:text-signal-800"
                  >
                    Dosyayı gör <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" onClick={() => openEdit(a)}>
                <Pencil size={14} />
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleDelete(a.id)}
                disabled={deletingId === a.id}
                className="text-pending-700 hover:bg-pending-100"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
          {isOpen && (
            <ul className="mt-3 divide-y divide-ink-100 rounded-md border border-ink-100 text-sm">
              {list.map((x) => {
                const done = x.status !== "pending";
                return (
                  <li key={x.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className={done ? "font-medium text-green-700" : "font-medium text-red-600"}>
                      {x.students?.name_surname || "(öğrenci)"}
                    </span>
                    <span className={done ? "text-xs font-semibold text-green-700" : "text-xs font-semibold text-red-600"}>
                      {done ? "Ödev teslim edildi" : "Ödev teslim bekliyor"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        icon={FileText}
        title="Ödevler"
        description="Ödevleri ders ve konulara göre klasörlerde gör, kimin teslim ettiğini takip et."
      />

      {loading ? (
        <p className="text-sm text-ink-400">Yükleniyor…</p>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-ink-400">
            Henüz ödev atamadın. "Ödev Ata" sayfasından başlayabilirsin.
          </CardContent>
        </Card>
      ) : (
        <>
          {renderBreadcrumb()}
          {lessonFolder === null && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lessons.map((l) =>
                folderCard(
                  l.id,
                  l.name,
                  assignments.filter((a) => lessonOf(a) === l.id).length,
                  () => {
                    setLessonFolder(l.id);
                    setTopicFolder(null);
                  },
                  {
                    onRename: () => openRename("lesson", l.id, l.name),
                    onDelete: () =>
                      deleteFolder("lesson", l.id, l.name, assignments.filter((a) => lessonOf(a) === l.id).length),
                  }
                )
              )}
              {assignments.some((a) => lessonOf(a) === NONE) &&
                folderCard(NONE, "Derssiz", assignments.filter((a) => lessonOf(a) === NONE).length, () => {
                  setLessonFolder(NONE);
                  setTopicFolder(NONE);
                })}
            </div>
          )}
          {lessonFolder !== null && lessonFolder !== NONE && topicFolder === null && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topics
                .filter((t) => t.lesson_id === lessonFolder)
                .map((t) =>
                  folderCard(
                    t.id,
                    t.name,
                    assignments.filter((a) => lessonOf(a) === lessonFolder && topicOf(a) === t.id).length,
                    () => setTopicFolder(t.id),
                    {
                      onRename: () => openRename("topic", t.id, t.name),
                      onDelete: () =>
                        deleteFolder(
                          "topic",
                          t.id,
                          t.name,
                          assignments.filter((a) => lessonOf(a) === lessonFolder && topicOf(a) === t.id).length
                        ),
                    }
                  )
                )}
              {assignments.some((a) => lessonOf(a) === lessonFolder && topicOf(a) === NONE) &&
                folderCard(
                  NONE,
                  "Konusuz",
                  assignments.filter((a) => lessonOf(a) === lessonFolder && topicOf(a) === NONE).length,
                  () => setTopicFolder(NONE)
                )}
            </div>
          )}
          {lessonFolder !== null && topicFolder !== null && (
            <div className="space-y-3">
              {assignments
                .filter((a) => lessonOf(a) === lessonFolder && topicOf(a) === topicFolder)
                .map((a) => renderAssignment(a))}
            </div>
          )}
        </>
      )}

      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {renameTarget?.kind === "lesson" ? "Dersin adını değiştir" : "Konunun adını değiştir"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitRename()}
              maxLength={60}
              autoFocus
            />
            {renameError && <p className="text-sm text-pending-700">{renameError}</p>}
            <Button onClick={submitRename} disabled={renameSaving} className="w-full">
              {renameSaving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ödevi düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600">
                Başlık
              </label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600">
                Açıklama
              </label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600">
                Son teslim tarihi
              </label>
              <Input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600">
                Cevap anahtarı
              </label>
              <textarea
                value={editAnswerKey}
                onChange={(e) => setEditAnswerKey(e.target.value)}
                rows={4}
                className="flex w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-signal-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600">Ders</label>
              <select
                value={editLessonId}
                onChange={(e) => {
                  setEditLessonId(e.target.value);
                  setEditTopicId("");
                }}
                className="flex h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-signal-400"
              >
                <option value="">Dersiz</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-600">Konu</label>
              <select
                value={editTopicId}
                onChange={(e) => setEditTopicId(e.target.value)}
                disabled={!editLessonId}
                className="flex h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-signal-400 disabled:opacity-50"
              >
                <option value="">Konusuz</option>
                {topics.filter((t) => t.lesson_id === editLessonId).map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            {formError && <p className="text-sm text-pending-700">{formError}</p>}
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
