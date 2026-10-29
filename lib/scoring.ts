export type ParsedScore = { correct: number; wrong: number; wrongQuestions: number[] };

// Teslim kaydından doğru/yanlış sayısını okur: önce score_data, yoksa yapay zekâ metni.
export function parseScore(
  score: { correct_count?: number; wrong_count?: number; wrong_questions?: unknown } | null,
  analysis: string | null
): ParsedScore | null {
  let src: any = score;
  if ((src?.correct_count == null && src?.wrong_count == null) && analysis) {
    try {
      src = JSON.parse(analysis.replace(/```json/gi, "").replace(/```/g, "").trim());
    } catch {
      return null;
    }
  }
  if (!src || (src.correct_count == null && src.wrong_count == null)) return null;
  const correct = Number(src.correct_count) || 0;
  const wrong = Number(src.wrong_count) || 0;
  if (correct + wrong === 0) return null;
  const wrongQuestions = Array.isArray(src.wrong_questions)
    ? src.wrong_questions.map((x: unknown) => Number(x)).filter((n: number) => Number.isFinite(n))
    : [];
  return { correct, wrong, wrongQuestions };
}
