import { runWeeklyMatch, weekStartMonday, KST_OFFSET_MS } from "./engine";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

/** Epoch ms of this KST week's scheduled run: Monday 19:00 Asia/Seoul. */
function thisWeeksFireTime(now: Date = new Date()): number {
  return Date.parse(`${weekStartMonday(now)}T19:00:00+09:00`);
}

/** Ms until the next Monday 19:00 KST strictly after `now`. */
export function msUntilNextMonday19KST(now: Date = new Date()): number {
  const kst = new Date(now.getTime() + KST_OFFSET_MS); // read UTC fields as KST
  const daysToMonday = (1 - kst.getUTCDay() + 7) % 7; // 0 if today is Monday
  let target =
    Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() + daysToMonday, 19, 0, 0) -
    KST_OFFSET_MS;
  if (target <= now.getTime()) target += WEEK_MS;
  return target - now.getTime();
}

/**
 * Opt-in weekly matching. Set `MATCH_CRON_ENABLED=true` on a SINGLE instance.
 *
 * Two timers, both safe to overlap because `runWeeklyMatch` is idempotent per
 * `match_rounds.weekStart` (later calls return `alreadyCompleted`):
 *
 * 1. Precise weekly trigger — a setTimeout chain that fires at Monday 19:00
 *    Asia/Seoul (KST has no DST, so the fixed-offset math is exact) and
 *    re-arms itself for the following Monday.
 * 2. Daily catch-up tick — if the instance was down at the scheduled time,
 *    the round is created on the next tick (or boot). It never runs EARLY:
 *    it no-ops until this week's Monday 19:00 KST has passed.
 */
export function startMatchScheduler(): void {
  if (process.env.MATCH_CRON_ENABLED !== "true") return;

  const tick = async (trigger: string) => {
    try {
      const result = await runWeeklyMatch();
      if (!result.alreadyCompleted) {
        console.log(`[match-scheduler] ran weekly match (${trigger}):`, JSON.stringify(result));
      }
    } catch (e) {
      console.error(`[match-scheduler] ${trigger} run failed:`, e);
    }
  };

  const armWeekly = () => {
    setTimeout(() => {
      void tick("weekly").finally(armWeekly);
    }, msUntilNextMonday19KST()).unref();
  };
  armWeekly();

  const catchUp = () => {
    if (Date.now() < thisWeeksFireTime()) return; // before Monday 19:00 KST — don't run early
    void tick("catch-up");
  };
  catchUp(); // restart-safe: heal a missed Monday on boot
  setInterval(catchUp, DAY_MS).unref();

  console.log("[match-scheduler] enabled (Mon 19:00 KST + daily idempotent catch-up).");
}
