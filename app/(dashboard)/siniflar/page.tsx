"use client";

import { useEffect, useState } from "react";
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

type ClassRow = {
  id: string;
  class_name: string;
  students: { count: number }[];
};

export default function SiniflarPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/siniflar").then((r) => r.json());
    setClasses(res.classes || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          Sınıflar
        </h1>
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
      </div>

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
              <CardContent>
                <p className="text-sm text-ink-400">
                  {c.students?.[0]?.count ?? 0} öğrenci
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
