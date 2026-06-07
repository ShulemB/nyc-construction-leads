export interface ScoreInput {
  latest_action_date?: string | null;
  job_type?: string | null;
  initial_cost?: number | null;
  total_construction_floor_area?: number | null;
  job_status?: string | null;
}

export function computeLeadScore(f: ScoreInput): number {
  let score = 0;

  // Recency: 0–30
  if (f.latest_action_date) {
    const days = Math.floor((Date.now() - new Date(f.latest_action_date).getTime()) / 86400000);
    score += Math.max(0, 30 - days);
  }

  // Job type: 0–25
  const typeScore: Record<string, number> = { NB: 25, A1: 20, DM: 15, A2: 10, A3: 5, SG: 2 };
  score += typeScore[f.job_type ?? ""] ?? 0;

  // Cost: 0–25 (log scale, $5M = full)
  if (f.initial_cost && f.initial_cost > 0) {
    score += Math.min(25, Math.round((Math.log10(f.initial_cost) / Math.log10(5_000_000)) * 25));
  }

  // Floor area: 0–10
  if (f.total_construction_floor_area && f.total_construction_floor_area > 0) {
    score += Math.min(10, Math.round((f.total_construction_floor_area / 100_000) * 10));
  }

  // Status: 0–10
  const statusScore: Record<string, number> = { A: 10, P: 8, R: 6, Q: 4, I: 1 };
  score += statusScore[f.job_status ?? ""] ?? 0;

  return Math.max(0, Math.min(100, Math.round(score)));
}
