"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Wallet } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Balance = { package_questions: number; period_months: number; blocks: number };
type StudentRow = { id: string; name_surname: string; plan_questions: number | null; license_end_date: string | null };
type HistoryRow = {
  id: string;
  kind: string;
  package_questions: number;
  period_months: number;
  student_name: string;
  reverted: boolean;
  can_revert: boolean;
  created_at: string;
};

const SHOP_LINKS = [
  { months: 1, url: "https://www.shopier.com/BultenAI/53184830" },
  { months: 3, url: "https://www.shopier.com/BultenAI/53184979" },
  { months: 6, url: "https://www.shopier.com/BultenAI/53185092" },
  { months: 10, url: "https://www.shopier.com/BultenAI/53185155" },
];

const selectCls = "flex h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm";

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("tr-TR");
}

function planDurumu(s: StudentRow) {
  if (!s.license_end_date) return { text: "Plan yok", cls: "text-ink-400" };
  const end = new Date(s.license_end_date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (end < today) return { text: "Süresi doldu", cls: "text-pending-700" };
  return { text: "Aktif", cls: "text-progress-700" };
}

export default function KredilerPage() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [studentId, setStudentId] = useState("");
  const [block, setBlock] = useState(""); // "pkg:period"
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/kredi");
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(j.error || "Yüklenemedi");
      setLoading(false);
      return;
    }
    setBalances(j.balances || []);
    setStudents(j.students || []);
    setHistory(j.history || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const usable = balances.filter((b) => b.blocks > 0);

  async function ata() {
    setError("");
    setMsg("");
    if (!studentId) return setError("Öğrenci seç");
    if (!block) return setError("Kredi paketi seç");
    const [p, m] = block.split(":").map(Number);
    const st = students.find((s) => s.id === studentId);
    if (!window.confirm(`${st?.name_surname} için 1 adet ${p} soru/gün × ${m} ay kredi kullanılacak. Onaylıyor musun?`)) return;
    setBusy(true);
    const res = await fetch("/api/kredi/ata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId, package_questions: p, period_months: m }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(j.error || "Atanamadı");
    setMsg(`Tanımlandı. Yeni bitiş tarihi: ${fmtDate(j.license_end_date)}`);
    setBlock("");
    load();
  }

  async function geriAl(h: HistoryRow) {
    if (!window.confirm(`${h.student_name} için yapılan atama geri alınacak, kredi bakiyene iade edilecek. Onaylıyor musun?`)) return;
    setError("");
    setMsg("");
    const res = await fetch("/api/kredi/geri-al", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ledger_id: h.id }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return setError(j.error || "Geri alınamadı");
    setMsg("Atama geri alındı, kredi iade edildi.");
    load();
  }

  return (
    <div>
      <PageHeader
        icon={Wallet}
        title="Krediler"
        description="Kredi bakiyeni gör, öğrencilerine soru kotası tanımla."
      />

      {error && <p className="mb-4 text-sm text-pending-700">{error}</p>}
      {msg && <p className="mb-4 text-sm text-progress-700">{msg}</p>}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Kredi satın al</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-ink-600">
            Süreyi seç, açılan sayfada soru kotasını (200 / 400 / 600 soru/gün) seçerek öğrenci başına
            kredi al. Ödemeyi aynı e-posta adresinle yapman, kredinin hesabına doğru yansıması için önemli.
          </p>
          <div className="flex flex-wrap gap-2">
            {SHOP_LINKS.map((l) => (
              <a
                key={l.months}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-signal-600 transition-colors hover:bg-signal-50"
              >
                {l.months} aylık <ExternalLink size={14} />
              </a>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-400">
            Ödeme sonrası kredi şimdilik yönetici tarafından hesabına tanımlanır; otomatik aktarım yakında eklenecek.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kredi bakiyen</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-ink-400">Yükleniyor…</p>
            ) : usable.length === 0 ? (
              <p className="text-sm text-ink-400">Henüz kredin yok.</p>
            ) : (
              <ul className="space-y-2">
                {usable.map((b) => (
                  <li
                    key={`${b.package_questions}:${b.period_months}`}
                    className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2 text-sm"
                  >
                    <span className="text-ink-900">
                      {b.package_questions} soru/gün × {b.period_months} ay
                    </span>
                    <span className="font-semibold text-signal-600">{b.blocks} adet</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Öğrenciye kredi tanımla</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={selectCls}>
              <option value="">Öğrenci seç…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name_surname}
                </option>
              ))}
            </select>
            <select value={block} onChange={(e) => setBlock(e.target.value)} className={selectCls}>
              <option value="">Kredi paketi seç…</option>
              {usable.map((b) => (
                <option key={`${b.package_questions}:${b.period_months}`} value={`${b.package_questions}:${b.period_months}`}>
                  {b.package_questions} soru/gün × {b.period_months} ay ({b.blocks} adet)
                </option>
              ))}
            </select>
            <Button onClick={ata} disabled={busy || usable.length === 0} className="w-full">
              {busy ? "Tanımlanıyor…" : "Tanımla"}
            </Button>
            <p className="text-xs text-ink-400">
              Öğrencinin süresi sürüyorsa aynı paket eklenir, süre uzar. Farklı paket, mevcut süre bitince atanabilir.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Öğrenci planları</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-ink-400">Öğrenci yok.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs text-ink-400">
                  <th className="pb-2 font-medium">Öğrenci</th>
                  <th className="pb-2 font-medium">Paket</th>
                  <th className="pb-2 font-medium">Bitiş</th>
                  <th className="pb-2 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const d = planDurumu(s);
                  return (
                    <tr key={s.id} className="border-b border-ink-50 last:border-0">
                      <td className="py-2.5 text-ink-900">{s.name_surname}</td>
                      <td className="py-2.5 text-ink-600">{s.plan_questions ? `${s.plan_questions} soru/gün` : "—"}</td>
                      <td className="py-2.5 text-ink-600">{fmtDate(s.license_end_date)}</td>
                      <td className={"py-2.5 font-medium " + d.cls}>{d.text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Son hareketler</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-ink-400">Henüz hareket yok.</p>
          ) : (
            <ul className="divide-y divide-ink-50 text-sm">
              {history.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span className="text-ink-900">
                    {h.kind === "assign" ? "Tanımlandı" : "İade"} · {h.student_name} · {h.package_questions} soru × {h.period_months} ay
                    {h.reverted && <span className="ml-2 text-xs text-ink-400">(geri alındı)</span>}
                  </span>
                  <span className="flex items-center gap-3 text-xs text-ink-400">
                    {new Date(h.created_at).toLocaleString("tr-TR")}
                    {h.can_revert && (
                      <button onClick={() => geriAl(h)} className="font-medium text-red-500 hover:text-red-700">
                        Geri al
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
