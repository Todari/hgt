/**
 * Maximum-weight bipartite matching (assignment problem) via the Hungarian
 * algorithm (Kuhn–Munkres, O(n²·m) potentials form).
 *
 * Input: `weight[i][j]` = score of pairing row i with column j (≥ 0).
 * Output: list of `[i, j]` pairs maximizing the total score, keeping only
 * positive-weight pairs (so a row/column with no good match stays unmatched).
 */
export function maxWeightBipartite(weight: number[][]): Array<[number, number]> {
  const rows0 = weight.length;
  const cols0 = rows0 > 0 ? (weight[0]?.length ?? 0) : 0;
  if (rows0 === 0 || cols0 === 0) return [];

  // Orient so that rows ≤ cols (the algorithm assigns every row to a column).
  const transposed = rows0 > cols0;
  const W = transposed
    ? Array.from({ length: cols0 }, (_, j) => Array.from({ length: rows0 }, (_, i) => weight[i]![j]!))
    : weight;
  const n = W.length; // rows
  const m = W[0]!.length; // cols, n ≤ m

  const INF = Infinity;
  const u = new Array<number>(n + 1).fill(0);
  const v = new Array<number>(m + 1).fill(0);
  const p = new Array<number>(m + 1).fill(0); // p[j] = row matched to column j (1-indexed)
  const way = new Array<number>(m + 1).fill(0);

  // cost = -weight  → minimizing cost maximizes weight
  const cost = (i: number, j: number) => -W[i - 1]![j - 1]!;

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array<number>(m + 1).fill(INF);
    const used = new Array<boolean>(m + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0]!;
      let delta = INF;
      let j1 = -1;
      for (let j = 1; j <= m; j++) {
        if (!used[j]) {
          const cur = cost(i0, j) - u[i0]! - v[j]!;
          if (cur < minv[j]!) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j]! < delta) {
            delta = minv[j]!;
            j1 = j;
          }
        }
      }
      for (let j = 0; j <= m; j++) {
        if (used[j]) {
          u[p[j]!] = u[p[j]!]! + delta;
          v[j] = v[j]! - delta;
        } else {
          minv[j] = minv[j]! - delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0]!;
      p[j0] = p[j1]!;
      j0 = j1;
    } while (j0 !== 0);
  }

  const result: Array<[number, number]> = [];
  for (let j = 1; j <= m; j++) {
    const i = p[j]!;
    if (i >= 1 && i <= n && W[i - 1]![j - 1]! > 0) {
      const row = transposed ? j - 1 : i - 1;
      const col = transposed ? i - 1 : j - 1;
      result.push([row, col]);
    }
  }
  return result;
}
