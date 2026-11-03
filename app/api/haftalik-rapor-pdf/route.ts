import path from "path";
import PDFDocument from "pdfkit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Topic = { name: string; d: number; y: number };
type Lesson = { name: string; assigned: number; solved: number; topics: Topic[] };
type Student = {
  name: string;
  total: number;
  correct: number;
  wrong: number;
  pct: number;
  lessons: Lesson[];
  aiText?: string;
};
type Payload = { range?: string; coachName?: string; students: Student[] };

const FONT = path.join(process.cwd(), "lib/fonts/DejaVuSans.ttf");
const BOLD = path.join(process.cwd(), "lib/fonts/DejaVuSans-Bold.ttf");

const C = {
  navy: "#1e3a8a",
  ink: "#111827",
  gray: "#6b7280",
  line: "#e5e7eb",
  card: "#f3f4f6",
  green: "#16a34a",
  red: "#dc2626",
};
const PALETTE = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#0d9488", "#4f46e5"];


type LessonNotes = { good: string[]; bad: string[] };
const norm = (x: string) => String(x || "").toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim();
const bullet = (l: string) => l.replace(/^[-•–*]\s*/, "").trim();

// Yeni biçim: "DERS: X" blokları (Başarılı/Zorlanılan) + "GENEL YORUM" bölümü.
// Eski biçimde (DERS: yok) tüm metin genel bölüm olarak kalır.
function parseAi(text: string) {
  const lines = String(text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const byLesson = new Map<string, LessonNotes>();
  const general: string[] = [];
  let cur: LessonNotes | null = null;
  let mode: "good" | "bad" | null = null;
  let inGeneral = false;
  for (const ln of lines) {
    const mDers = ln.match(/^DERS\s*:\s*(.+)$/i);
    if (!inGeneral && mDers) {
      cur = { good: [], bad: [] };
      byLesson.set(norm(mDers[1]), cur);
      mode = null;
      continue;
    }
    if (/^(\d\.\s*)?genel yorum/i.test(ln)) {
      inGeneral = true;
      cur = null;
      general.push("4. Genel Yorum ve Öneri");
      continue;
    }
    if (!inGeneral && cur) {
      if (/^(\d\.\s*)?başarılı/i.test(ln)) { mode = "good"; continue; }
      if (/^(\d\.\s*)?zorlan/i.test(ln)) { mode = "bad"; continue; }
      const b = bullet(ln);
      if (mode && b && b !== "-") cur[mode].push(b);
      continue;
    }
    general.push(ln);
  }
  return { byLesson, general, structured: byLesson.size > 0 || inGeneral };
}

export async function POST(req: Request) {
  const secret = process.env.NEXT_PUBLIC_TRACKCOACH_WEBHOOK_SECRET || process.env.TRACKCOACH_WEBHOOK_SECRET;
  if (!secret || req.headers.get("x-trackcoach-secret") !== secret) {
    return new Response("Yetkisiz", { status: 401 });
  }
  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return new Response("Geçersiz istek", { status: 400 });
  }
  const students = Array.isArray(body.students) ? body.students : [];

  const doc = new PDFDocument({ size: "A4", margin: 40, font: FONT, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const L = 40;
  const W = doc.page.width - 80;
  const bottom = () => doc.page.height - 60;
  const need = (h: number) => {
    if (doc.y + h > bottom()) doc.addPage();
  };

  // Kapak bandı
  doc.rect(0, 0, doc.page.width, 110).fill(C.navy);
  doc.fillColor("#ffffff").font(BOLD).fontSize(26).text("TrackCoach", L, 30, { width: W });
  doc.font(FONT).fontSize(14).text("Haftalık Gelişim Raporu", L, 62, { width: W });
  doc.fontSize(10).fillColor("#bfdbfe").text(
    [body.range ? "Dönem: " + body.range : "", body.coachName ? "Koç: " + body.coachName : ""].filter(Boolean).join("   •   "),
    L, 86, { width: W }
  );
  doc.y = 130;

  students.forEach((s, idx) => {
    const color = PALETTE[idx % PALETTE.length];
    need(190);
    if (idx > 0) doc.moveDown(0.8);

    // Öğrenci başlığı
    const y0 = doc.y;
    doc.rect(L, y0, 6, 34).fill(color);
    doc.fillColor(color).font(BOLD).fontSize(20).text(String(s.name || "").toLocaleUpperCase("tr-TR"), L + 16, y0 + 5, { width: W - 16 });
    doc.y = y0 + 46;

    // Özet kutuları
    const boxes: [string, string, string][] = [
      ["Toplam soru", String(s.total ?? 0), C.ink],
      ["Doğru", String(s.correct ?? 0), C.green],
      ["Yanlış", String(s.wrong ?? 0), C.red],
      ["Başarı", s.total ? "%" + (s.pct ?? 0) : "-", color],
    ];
    const bw = (W - 3 * 10) / 4;
    const by = doc.y;
    boxes.forEach(([label, val, col], i) => {
      const x = L + i * (bw + 10);
      doc.roundedRect(x, by, bw, 50, 6).fill(C.card);
      doc.fillColor(col).font(BOLD).fontSize(18).text(val, x, by + 8, { width: bw, align: "center" });
      doc.fillColor(C.gray).font(FONT).fontSize(8.5).text(label, x, by + 33, { width: bw, align: "center" });
    });
    doc.y = by + 64;

    const ai = parseAi(s.aiText || "");

    // Dersler
    if (!s.lessons || !s.lessons.length) {
      doc.fillColor(C.gray).font(FONT).fontSize(10).text("Bu hafta atanan ya da teslim edilen ödev yok.", L, doc.y, { width: W });
      doc.moveDown(0.6);
    }
    (s.lessons || []).forEach((les) => {
      const topics = les.topics || [];
      need(34 + Math.min(topics.length, 3) * 24);
      const ly = doc.y;
      doc.roundedRect(L, ly, W, 26, 5).fill(color);
      doc.fillColor("#ffffff").font(BOLD).fontSize(11.5).text(String(les.name || "").toLocaleUpperCase("tr-TR"), L + 12, ly + 7, { width: W * 0.55 });
      doc.font(FONT).fontSize(9.5).text(`Atanan test: ${les.assigned ?? 0}   •   Çözülen test: ${les.solved ?? 0}`, L + W * 0.45, ly + 8, { width: W * 0.55 - 12, align: "right" });
      doc.y = ly + 32;

      topics.forEach((t) => {
        need(24);
        const ty = doc.y;
        doc.fillColor(C.ink).font(FONT).fontSize(10).text(String(t.name || ""), L + 8, ty + 3, { width: W * 0.42, lineBreak: false, ellipsis: true });
        const barX = L + W * 0.46;
        const barW = W * 0.34;
        const sum = (t.d || 0) + (t.y || 0);
        doc.roundedRect(barX, ty + 4, barW, 9, 4.5).fill(C.line);
        if (sum > 0) {
          const gw = barW * ((t.d || 0) / sum);
          if (t.d > 0) doc.roundedRect(barX, ty + 4, Math.max(gw, 6), 9, 4.5).fill(C.green);
          if (t.y > 0) {
            const rw = barW - gw;
            doc.roundedRect(barX + gw, ty + 4, Math.max(rw, 6), 9, 4.5).fill(C.red);
          }
        }
        doc.fillColor(C.green).font(BOLD).fontSize(10).text(`${t.d ?? 0} D`, L + W * 0.83, ty + 3, { width: 40, lineBreak: false });
        doc.fillColor(C.red).text(`${t.y ?? 0} Y`, L + W * 0.83 + 38, ty + 3, { width: 40, lineBreak: false });
        doc.moveTo(L + 8, ty + 21).lineTo(L + W, ty + 21).lineWidth(0.5).strokeColor(C.line).stroke();
        doc.y = ty + 24;
      });
      const notes = ai.structured ? ai.byLesson.get(norm(les.name)) : undefined;
      if (notes) {
        const sect = (title: string, items: string[], col: string) => {
          need(36);
          doc.moveDown(0.2);
          doc.fillColor(col).font(BOLD).fontSize(10.5).text(title, L + 8, doc.y, { width: W - 8 });
          doc.moveDown(0.15);
          if (!items.length) {
            doc.fillColor(C.gray).font(FONT).fontSize(10).text("Bu hafta belirgin bir konu yok.", L + 22, doc.y, { width: W - 22 });
            doc.moveDown(0.2);
            return;
          }
          items.forEach((txt) => {
            need(22);
            const yy = doc.y;
            doc.circle(L + 14, yy + 6, 1.8).fill(col);
            doc.fillColor(C.ink).font(FONT).fontSize(10).text(txt, L + 22, yy, { width: W - 22, lineGap: 2 });
            doc.moveDown(0.2);
          });
        };
        sect("Başarılı Olunan Konular", notes.good, C.green);
        sect("Zorlanılan Konular", notes.bad, C.red);
      }
      doc.moveDown(0.6);
    });

    // Yapay zekâ değerlendirmesi (genel yorum; eski biçimde tüm metin)
    const lines = ai.general;
    lines.forEach((ln) => {
      if (/^[2-9]\.\s/.test(ln)) {
        need(50);
        doc.moveDown(0.4);
        const hy = doc.y;
        doc.rect(L, hy, 3, 16).fill(color);
        doc.fillColor(color).font(BOLD).fontSize(12).text(ln.replace(/^\d\.\s*/, ""), L + 10, hy + 1, { width: W - 10 });
        doc.y = hy + 22;
      } else if (/^[-•–]/.test(ln)) {
        need(24);
        const txt = ln.replace(/^[-•–]\s*/, "");
        const by2 = doc.y;
        if (txt === "" ) return;
        doc.circle(L + 12, by2 + 6, 1.8).fill(color);
        doc.fillColor(C.ink).font(FONT).fontSize(10).text(txt, L + 22, by2, { width: W - 22, lineGap: 2 });
        doc.moveDown(0.2);
      } else {
        need(24);
        doc.fillColor(C.ink).font(BOLD).fontSize(10.5).text(ln.replace(/:$/, ""), L + 4, doc.y + 2, { width: W - 4 });
        doc.moveDown(0.2);
      }
    });

    doc.moveDown(0.6);
    doc.moveTo(L, doc.y).lineTo(L + W, doc.y).lineWidth(1).strokeColor(C.line).stroke();
    doc.moveDown(0.6);
  });

  // Alt bilgi
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0;
    doc.fillColor(C.gray).font(FONT).fontSize(8).text(`TrackCoach • Sayfa ${i + 1} / ${range.count}`, L, doc.page.height - 36, { width: W, align: "center", lineBreak: false });
  }
  doc.end();
  const pdf = await done;

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="haftalik-rapor.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
