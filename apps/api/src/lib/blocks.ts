import { and, eq, or } from "drizzle-orm";
import { db } from "../db/client";
import { blocks } from "../db/schema";

/**
 * True if either user has blocked the other. A block in EITHER direction
 * hides conversations, rejects new messages and excludes the pair from
 * match results — shared by chat and match routes.
 */
export async function isBlocked(a: string, b: string): Promise<boolean> {
  const [row] = await db
    .select()
    .from(blocks)
    .where(
      or(
        and(eq(blocks.blockerId, a), eq(blocks.blockedId, b)),
        and(eq(blocks.blockerId, b), eq(blocks.blockedId, a)),
      ),
    )
    .limit(1);
  return Boolean(row);
}
