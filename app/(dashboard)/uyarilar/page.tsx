"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { avatarStyle, initials } from "@/lib/utils";

type Level = "red" | "yellow" | "green" | "none";
type Row = {
  id: string;
  name: string;
  className: string | null;
  level: Level;
  reasons: string[];
  assignedCount: number;
  deliveredCount: number;
  overdueCount: number;
  lastSubmissionDay: string | null;
  recentSuccess: number | null;
};

const LEVELS: { key: Level | "all"; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "red", label: "Acil" },
  { key: "yellow", label: "Dikkat" },
  { key: "green", label: "Sorunsuz" },
  { key: "none", label: "Ödevsiz" },
];

const DOT: Record<Level, string> = {
  red: "bg-red-500",
  yellow: "bg-pending-500",
  green: "bg-progress-500",
  none: "bg-ink-200",
};
const REASON_STYLE: Record<Level, string> = {
  red: "bg-red-50 text-red-700",
  yellow: "bg-pending-100 text-pending-700",
  green: "bg-progress-100 text-progress-700",
  none: "bg-ink-50 text-ink-600",
};

function dayText(d: string | null) {
  if (!d) return "Hiç teslim yok";
  const [y, m, dd] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, dd)).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export default function UyarilarPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Level | "all">("all");

  useEffect(() => {
    fetch("/api/uyarilar")
      .then((r) => r.json())
      .then((res) => {
        if (res.error) setError(res.error);
        else setRows(res.students || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Veriler yüklenemedi.");
        setLoading(false);
      });
  }, []);

  const count = (l: Level) => rows.filter((r) => r.level === l).length;
  const shown = filter === "all" ? rows : rows.filter((r) => r.level === filter);

  return (
    <div>
      <PageHeader
        icon={BellRing}
        title="Dikkat Panosu"
        description="Bugün kimle ilgilenmen gerektiğini tek bakışta gör."
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["red", "Acil", "Hemen ilgilen"],
            ["yellow", "Dikkat", "Yakından izle"],
            ["green", "Sorunsuz", "Yolunda"],
            ["none", "Ödevsiz", "Ödev atanmamış"],
          ] as [Level, string, string][]
        ).map(([l, title, hint]) => (
          <button
            key={l}
            onClick={() => setFilter(filter === l ? "all" : l)}
            className={
              "rounded-card border bg-white p-4 text-left shadow-card transition-all hover:-translate-y-0.5 " +
              (filter === l ? "border-signal-400 ring-2 ring-signal-200" : "border-ink-100")
            }
          >
            <div className="flex items-center gap-2 text-sm font-medium text-ink-600">
              <span className={"h-2.5 w-2.5 rounded-full " + DOT[l]} />
              {title}
            </div>
            <p className="mt-1 font-display text-3xl font-semibold text-ink-900">{count(l)}</p>
            <p className="text-xs text-ink-400">{hint}</p>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Duruma göre filtrele">
        {LEVELS.map((l) => (
          <button
            key={l.key}
            onClick={() => setFilter(l.key)}
            aria-pressed={filter === l.key}
            className={
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors " +
              (filter === l.key
                ? "bg-signal-600 text-white"
                : "border border-ink-200 bg-white text-ink-600 hover:border-signal-300")
            }
          >
            {l.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-ink-400">Yükleniyor…</p>
      ) : error ? (
        <p className="text-sm text-pending-700">{error}</p>
      ) : shown.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-ink-400">
            {rows.length === 0
              ? "Henüz öğrencin yok. Öğrenci ekleyince burada durumlarını göreceksin."
              : "Bu durumda öğrenci yok."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {shown.map((s) => (
            <Link
              key={s.id}
              href={`/ogrenciler/${s.id}`}
              className="group flex flex-wrap items-center gap-4 rounded-card border border-ink-100 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-signal-200"
            >
              <span className="relative">
                <span
                  className={
                    "flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold " +
                    avatarStyle(s.name)
                  }
                >
                  {initials(s.name)}
                </span>
                <span
                  className={"absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white " + DOT[s.level]}
                />
              </span>
              <div className="min-w-0 flex-1 basis-56">
                <p className="font-medium text-ink-900">
                  {s.name}
                  <span className="ml-2 text-xs font-normal text-ink-400">{s.className || "Sınıfsız"}</span>
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {s.reasons.map((r) => (
                    <span key={r} className={"rounded-full px-2.5 py-0.5 text-xs font-medium " + REASON_STYLE[s.level]}>
                      {r}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <p className="font-medium text-ink-900">
                    {s.deliveredCount}/{s.assignedCount}
                  </p>
                  <p className="text-xs text-ink-400">teslim</p>
                </div>
                <div className="min-w-[4.5rem]">
                  <p className="font-medium text-ink-900">
                    {s.recentSuccess == null ? "—" : `%${s.recentSuccess}`}
                  </p>
                  <p className="text-xs text-ink-400">son başarı</p>
                </div>
                <div className="hidden min-w-[6rem] sm:block">
                  <p className="font-medium text-ink-900">{dayText(s.lastSubmissionDay)}</p>
                  <p className="text-xs text-ink-400">son teslim</p>
                </div>
                <ChevronRight size={16} className="text-ink-400 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-ink-400">
        Acil: 2+ ödevin süresi geçmiş, 14+ gündür teslim yok ya da son 3 teslimde başarı %50'nin altı.
        Dikkat: 1 ödevin süresi geçmiş, 7+ gündür teslim yok ya da başarı %70'in altı. Başarı, yapay zekânın
        değerlendirmesine dayanır.
      </p>
    </div>
  );
}
