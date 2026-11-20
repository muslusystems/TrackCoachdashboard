"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ChevronDown, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Balance = { package_questions: number; period_months: number; blocks: number };
type Coach = { id: string; name: string; email: string; is_admin: boolean; balances: Balance[] };
type Row = {
  id: string;
  package_questions: number;
  period_months: number;
  qty: number;
  reason: string;
  note: string | null;
  created_at: string;
};

const PACKAGES = [200, 400, 600];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const REASONS: Record<string, string> = {
  manual: "Elle",
  purchase: "Satın alma",
  assign: "Öğrenciye tanımlandı",
  refund: "İade",
  test: "Test",
};
const selectCls = "flex h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm";

export default function YoneticiPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [pkg, setPkg] = useState(200);
  const [period, setPeriod] = useState(1);
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [history, setHistory] = useState<Record<string, Row[]>>({});

  async function load() {
    const res = await fetch("/api/yonetici/koclar").then((r) => r.json()).catch(() => null);
    if (!res || res.error) setError(res?.error || "Yüklenemedi");
    else setCoaches(res.coaches);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function loadHistory(coachId: string) {
    const res = await fetch(`/api/yonetici/kredi?coach_id=${coachId}`).then((r) => r.json()).catch(() => null);
    setHistory((h) => ({ ...h, [coachId]: res?.rows || [] }));
  }

  function toggle(c: Coach) {
    if (openId === c.id) {
      setOpenId(null);
      return;
    }
    setOpenId(c.id);
    setMsg("");
    loadHistory(c.id);
  }

  async function save(c: Coach) {
    const n = Math.abs(parseInt(qty, 10));
    if (!n) {
      setMsg("Adet gir.");
      return;
    }
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/yonetici/kredi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coach_id: c.id,
        package_questions: pkg,
        period_months: period,
        qty: mode === "add" ? n : -n,
        note,
      }),
    });
    const j = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setMsg(j.error || "Kaydedilemedi");
      return;
    }
    setMsg("Kaydedildi.");
    setNote("");
    await load();
    await loadHistory(c.id);
  }

  return (
    <div>
      <PageHeader
        icon={ShieldCheck}
        title="Yönetici"
        description="Kayıtlı koçlar ve kredi bakiyeleri. Elle kredi ekle ya da çıkar."
      />
      {loading ? (
        <p className="text-sm text-ink-400">Yükleniyor…</p>
      ) : error ? (
        <p className="text-sm text-pending-700">{error}</p>
      ) : coaches.length === 0 ? (
        <p className="text-sm text-ink-400">Kayıtlı koç yok.</p>
      ) : (
        <div className="space-y-4">
          {coaches.map((c) => {
            const open = openId === c.id;
            return (
              <Card key={c.id}>
                <CardContent className="p-0">
                  <button
                    type="button"
                    onClick={() => toggle(c)}
                    className="flex w-full items-start gap-3 p-5 text-left"
                  >
                    {open ? <ChevronDown size={18} className="mt-1" /> : <ChevronRight size={18} className="mt-1" />}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink-900">
                        {c.name || c.email || "(adsız koç)"}
                        {c.is_admin && (
                          <span className="ml-2 rounded-full bg-signal-50 px-2 py-0.5 text-xs font-medium text-signal-700">
                            Yönetici
                          </span>
                        )}
                      </p>
                      {c.name && <p className="text-xs text-ink-400">{c.email}</p>}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {c.balances.length === 0 ? (
                          <span className="text-xs text-ink-400">Kredisi yok</span>
                        ) : (
                          c.balances.map((b) => (
                            <span
                              key={b.package_questions + ":" + b.period_months}
                              className="rounded-full bg-signal-50 px-2.5 py-1 text-xs font-medium text-signal-700"
                            >
                              {b.package_questions} soru · {b.period_months} ay × {b.blocks}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </button>

                  {open && (
                    <div className="space-y-5 border-t border-ink-100 p-5">
                      <div className="grid gap-3 sm:grid-cols-5">
                        <div>
                          <label className="mb-1 block text-xs text-ink-400">İşlem</label>
                          <select className={selectCls} value={mode} onChange={(e) => setMode(e.target.value as "add" | "remove")}>
                            <option value="add">Kredi ekle</option>
                            <option value="remove">Kredi çıkar</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-ink-400">Soru kotası (günlük)</label>
                          <select className={selectCls} value={pkg} onChange={(e) => setPkg(Number(e.target.value))}>
                            {PACKAGES.map((p) => (
                              <option key={p} value={p}>{p} soru</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-ink-400">Süre</label>
                          <select className={selectCls} value={period} onChange={(e) => setPeriod(Number(e.target.value))}>
                            {PERIODS.map((m) => (
                              <option key={m} value={m}>{m} ay</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-ink-400">Adet</label>
                          <Input type="number" min={1} max={1000} value={qty} onChange={(e) => setQty(e.target.value)} />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-ink-400">Not (isteğe bağlı)</label>
                          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Örn. havale, hediye" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button onClick={() => save(c)} disabled={saving}>
                          {saving ? "Kaydediliyor…" : mode === "add" ? "Krediyi ekle" : "Krediyi çıkar"}
                        </Button>
                        {msg && <span className="text-sm text-ink-600">{msg}</span>}
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-semibold text-ink-700">Son hareketler</p>
                        {!history[c.id] ? (
                          <p className="text-xs text-ink-400">Yükleniyor…</p>
                        ) : history[c.id].length === 0 ? (
                          <p className="text-xs text-ink-400">Henüz hareket yok.</p>
                        ) : (
                          <ul className="divide-y divide-ink-100 rounded-lg border border-ink-100 text-sm">
                            {history[c.id].map((r) => (
                              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                                <span className={r.qty > 0 ? "font-medium text-progress-700" : "font-medium text-pending-700"}>
                                  {r.qty > 0 ? "+" : ""}
                                  {r.qty} × {r.package_questions} soru · {r.period_months} ay
                                </span>
                                <span className="text-xs text-ink-400">
                                  {REASONS[r.reason] || r.reason}
                                  {r.note ? " · " + r.note : ""} · {new Date(r.created_at).toLocaleString("tr-TR")}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
