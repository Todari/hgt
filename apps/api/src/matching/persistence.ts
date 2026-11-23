import { and, eq, isNull } from "drizzle-orm";
import type { db } from "../db/client";
import { conversations, matches } from "../db/schema";

type Database = Pick<typeof db, "transaction">;
type MatchInsert = typeof matches.$inferInsert;

/** A failed conversation write must never consume a user's weekly match. */
export function persistMatches(database: Database, rows: MatchInsert[]) {
  return database.transaction(async (tx) => {
    const inserted = await tx.insert(matches).values(rows).returning({
      id: matches.id, male: matches.maleUserId, female: matches.femaleUserId,
    });
    await tx.insert(conversations).values(inserted.map((match) => ({
      matchId: match.id, userAId: match.male, userBId: match.female,
    }))).onConflictDoNothing();
    return inserted;
  });
}

/** Repair legacy partial writes across all rounds; never replace chat history. */
export function repairMissingConversations(database: Database) {
  return database.transaction(async (tx) => {
    const missing = await tx.select({
      matchId: matches.id, userAId: matches.maleUserId, userBId: matches.femaleUserId,
    }).from(matches).leftJoin(conversations, and(
      eq(conversations.userAId, matches.maleUserId),
      eq(conversations.userBId, matches.femaleUserId),
    )).where(isNull(conversations.id));
    if (missing.length === 0) return 0;
    const repaired = await tx.insert(conversations).values(missing)
      .onConflictDoNothing().returning({ id: conversations.id });
    return repaired.length;
  });
}
