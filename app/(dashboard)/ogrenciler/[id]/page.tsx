"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AssignedItem = {
  id: string;
  status: string;
  created_at: string;
  assignments: { id: string; title: string; due_date: string | null; drive_pdf_url: string | null } | null;
};

type SubmissionItem = {
  id: string;
  drive_photo_url: string | null;
  gemini_analysis: string | null;
  created_at: string;
  assignments: { title: string } | null;
};

type StudentDetail = {
  student: { id: string; name_surname: string; status: string; classes: { class_name: string } | null };
  assignedAssignments: AssignedItem[];
  submissions: SubmissionItem[];
};

export default function OgrenciDetayPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div>
      <Link
        href="/ogrenciler"
        className="mb-4 flex items-center gap-1 text-sm text-ink-400 hover:text-ink-800"
      >
        <ArrowLeft size={14} /> Öğrencilere dön
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          {data.student.name_surname}
        </h1>
        <p className="text-sm text-ink-400">
          {data.student.classes?.class_name || "Sınıfsız"} ·{" "}
          <span className="text-progress-700">
            {data.student.status === "active" ? "Aktif" : data.student.status}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atanan Ödevler ({data.assignedAssignments.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.assignedAssignments.length === 0 ? (
              <p className="text-sm text-ink-400">Henüz ödev atanmamış.</p>
            ) : (
              data.assignedAssignments.map((a) => (
                <div
                  key={a.id}
                  className="rounded-md border border-ink-100 px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-ink-900">
                      {a.assignments?.title || "(silinmiş ödev)"}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.status === "pending"
                          ? "bg-pending-100 text-pending-700"
                          : "bg-progress-100 text-progress-700"
                      }`}
                    >
                      {a.status === "pending" ? "Bekliyor" : a.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-ink-400">
                    {a.assignments?.due_date && <span>Son tarih: {a.assignments.due_date}</span>}
                    {a.assignments?.drive_pdf_url && (
                      <a
                        href={a.assignments.drive_pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-signal-600 hover:text-signal-800"
                      >
                        Dosya <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gelen Cevaplar ({data.submissions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.submissions.length === 0 ? (
              <p className="text-sm text-ink-400">Henüz teslim edilmiş bir çözüm yok.</p>
            ) : (
              data.submissions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-md border border-ink-100 px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-ink-900">
                      {s.assignments?.title || "(ödev bilgisi yok)"}
                    </p>
                    {s.drive_photo_url && (
                      <a
                        href={s.drive_photo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex shrink-0 items-center gap-1 text-signal-600 hover:text-signal-800"
                      >
                        Fotoğraf <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                  {s.gemini_analysis && (
                    <p className="mt-1.5 whitespace-pre-line rounded bg-ink-50 px-2 py-1.5 text-xs text-ink-600">
                      {s.gemini_analysis}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-ink-400">
                    {new Date(s.created_at).toLocaleString("tr-TR")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
