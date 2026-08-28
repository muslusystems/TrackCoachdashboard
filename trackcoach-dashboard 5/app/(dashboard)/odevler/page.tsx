"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, ExternalLink, KeyRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  created_at: string;
  student_assignments: { count: number }[];
};

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

  async function load() {
    setLoading(true);
    const res = await fetch("/api/odevler").then((r) => r.json());
    setAssignments(res.assignments || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openEdit(a: Assignment) {
    setEditing(a);
    setEditTitle(a.title || "");
    setEditDescription(a.description || "");
    setEditAnswerKey(a.answer_key || "");
    setEditDueDate(a.due_date || "");
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

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold text-ink-900">
        Ödevler
      </h1>

      {loading ? (
        <p className="text-sm text-ink-400">Yükleniyor…</p>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-ink-400">
            Henüz ödev atamadın. "Ödev Ata" sayfasından başlayabilirsin.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-start justify-between gap-4 py-4">
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
                    <p className="mt-0.5 truncate text-sm text-ink-600">
                      {a.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-400">
                    <span>
                      {a.student_assignments?.[0]?.count ?? 0} öğrenciye atandı
                    </span>
                    {a.due_date && <span>Son tarih: {a.due_date}</span>}
                    <span>
                      {new Date(a.created_at).toLocaleDateString("tr-TR")}
                    </span>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
