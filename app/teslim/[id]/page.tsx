import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Öğrenci cevapları", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function driveIds(raw: string | null): string[] {
  return String(raw || "")
    .split(/\s+/)
    .map((u) => u.match(/\/d\/([\w-]+)/)?.[1] || u.match(/[?&]id=([\w-]+)/)?.[1])
    .filter((x): x is string => !!x);
}

export default async function TeslimPage({ params }: { params: { id: string } }) {
  const notFound = (
    <main className="mx-auto max-w-xl p-6 text-center text-gray-600">Teslim bulunamadı.</main>
  );
  if (!UUID.test(params.id)) return notFound;

  const { data: sub } = await supabaseAdmin
    .from("submissions")
    .select("drive_photo_url, created_at, students(name_surname), assignments(title)")
    .eq("id", params.id)
    .maybeSingle();
  if (!sub) return notFound;

  const ids = driveIds(sub.drive_photo_url);
  const student = (sub as any).students?.name_surname || "Öğrenci";
  const title = (sub as any).assignments?.title || "Ödev";

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-lg font-semibold text-gray-900">{student} — {title}</h1>
      <p className="mb-4 text-sm text-gray-500">{ids.length} sayfa</p>
      {ids.length === 0 && <p className="text-gray-600">Fotoğraf bulunamadı.</p>}
      <div className="space-y-4">
        {ids.map((id, i) => (
          <figure key={id} className="overflow-hidden rounded-lg border bg-white">
            <figcaption className="px-3 py-1 text-xs text-gray-500">Sayfa {i + 1}</figcaption>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://drive.google.com/thumbnail?id=${id}&sz=w1600`}
              alt={`Sayfa ${i + 1}`}
              className="w-full"
              loading="lazy"
            />
            <a
              href={`https://drive.google.com/file/d/${id}/view`}
              className="block px-3 py-1 text-xs text-blue-600"
            >
              Orijinali aç
            </a>
          </figure>
        ))}
      </div>
    </main>
  );
}
