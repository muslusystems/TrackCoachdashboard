export type Level = "red" | "yellow" | "green" | "none";

export type AlertStudent = {
  id: string;
  name: string;
  className: string | null;
  level: Level;
  reasons: string[];
  assignedCount: number;
  deliveredCount: number;
  overdueCount: number;
  lastSubmissionDay: string | null;
  recentSuccess: number | null; // son teslimlerdeki doğru yüzdesi
};

type Asg = { pending: boolean; createdDay: string; dueDay: string | null };
type Sub = {
  createdAt: string;
  score: { correct_count?: number; wrong_count?: number } | null;
  analysis: string | null;
};

const dayKey = (d: string) =>
  new Date(d).toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
const diffDays = (a: string, b: string) =>
  Math.round((Date.parse(a) - Date.parse(b)) / 86400000);

function scoreOf(s: Sub): { c: number; w: number } | null {
  let c = s.score?.correct_count;
  let w = s.score?.wrong_count;
  if (c == null && w == null && s.analysis) {
    try {
      const p = JSON.parse(s.analysis.replace(/```json/gi, "").replace(/```/g, "").trim());
      c = p.correct_count;
      w = p.wrong_count;
    } catch {
      return null;
    }
  }
  if (c == null && w == null) return null;
  const cc = Number(c) || 0;
  const ww = Number(w) || 0;
  return cc + ww > 0 ? { c: cc, w: ww } : null;
}

const RANK: Record<Level, number> = { red: 0, yellow: 1, green: 2, none: 3 };
export const levelRank = (l: Level) => RANK[l];

// Kurallar (gün olarak): gecikmiş ödev, hareketsizlik, son teslimlerdeki başarı
export function evaluateStudent(
  info: { id: string; name: string; className: string | null },
  assigned: Asg[],
  submissions: Sub[],
  today: string
): AlertStudent {
  const reasons: string[] = [];
  let level: Level = "green";
  const raise = (l: Level) => {
    if (RANK[l] < RANK[level]) level = l;
  };

  const pending = assigned.filter((a) => a.pending);
  const overdue = pending.filter((a) => a.dueDay && a.dueDay < today);
  const subsSorted = [...submissions].sort(
    (x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()
  );
  const lastSubmissionDay = subsSorted[0] ? dayKey(subsSorted[0].createdAt) : null;

  if (assigned.length === 0) {
    return {
      ...info,
      level: "none",
      reasons: ["Henüz ödev atanmamış"],
      assignedCount: 0,
      deliveredCount: 0,
      overdueCount: 0,
      lastSubmissionDay,
      recentSuccess: null,
    };
  }

  // 1) Gecikmiş ödev
  if (overdue.length >= 2) {
    raise("red");
    reasons.push(`${overdue.length} ödevin süresi geçti`);
  } else if (overdue.length === 1) {
    raise("yellow");
    reasons.push("1 ödevin süresi geçti");
  }

  // 2) Hareketsizlik: bekleyen ödevi var ama uzun süredir teslim yok
  if (pending.length > 0) {
    const oldestPending = pending.map((a) => a.createdDay).sort()[0];
    const since = lastSubmissionDay && lastSubmissionDay > oldestPending ? lastSubmissionDay : oldestPending;
    const idle = diffDays(today, since);
    if (idle >= 14) {
      raise("red");
      reasons.push(lastSubmissionDay ? `${idle} gündür teslim yok` : `${idle} gündür hiç teslim yok`);
    } else if (idle >= 7) {
      raise("yellow");
      reasons.push(lastSubmissionDay ? `${idle} gündür teslim yok` : `${idle} gündür hiç teslim yok`);
    }
  }

  // 3) Başarı: son 3 değerlendirilmiş teslim
  const scored = subsSorted.map(scoreOf).filter((x): x is { c: number; w: number } => !!x).slice(0, 3);
  let recentSuccess: number | null = null;
  if (scored.length > 0) {
    const c = scored.reduce((t, x) => t + x.c, 0);
    const w = scored.reduce((t, x) => t + x.w, 0);
    recentSuccess = Math.round((c / (c + w)) * 100);
    if (recentSuccess < 50) {
      raise("red");
      reasons.push(`Son teslimlerde başarı %${recentSuccess}`);
    } else if (recentSuccess < 70) {
      raise("yellow");
      reasons.push(`Son teslimlerde başarı %${recentSuccess}`);
    }
  }

  if (reasons.length === 0) reasons.push("Sorun görünmüyor");
  return {
    ...info,
    level,
    reasons,
    assignedCount: assigned.length,
    deliveredCount: assigned.length - pending.length,
    overdueCount: overdue.length,
    lastSubmissionDay,
    recentSuccess,
  };
}
