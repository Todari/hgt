import { runWeeklyMatch } from "./engine";

/**
 * Opt-in weekly matching. Set `MATCH_CRON_ENABLED=true` on a SINGLE instance.
 *
 * Implemented as a daily check rather than a precise weekly trigger: the round
 * is keyed by the week's Monday, so `runWeeklyMatch` actually matches only once
 * per week (later daily checks return `alreadyCompleted`). This is restart-safe
 * and self-healing — if the server is down on Monday it catches up on next boot.
 */
export function startMatchScheduler(): void {
  if (process.env.MATCH_CRON_ENABLED !== "true") return;

  const DAY_MS = 24 * 60 * 60 * 1000;
  const tick = async () => {
    try {
      const result = await runWeeklyMatch();
      if (!result.alreadyCompleted) {
        console.log("[match-scheduler] ran weekly match:", JSON.stringify(result));
      }
    } catch (e) {
      console.error("[match-scheduler] failed:", e);
    }
  };

  void tick();
  setInterval(() => void tick(), DAY_MS);
  console.log("[match-scheduler] enabled (daily check, weekly-idempotent).");
}
