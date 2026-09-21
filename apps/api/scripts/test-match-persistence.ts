import assert from "node:assert/strict";
import { persistMatches, repairMissingConversations } from "../src/matching/persistence";
import { conversations, matches } from "../src/db/schema";

// Transactional in-memory adapter: no database, env loading, or notifications.
type Pair = { id: string; male: string; female: string };
type Conversation = { matchId: string; userAId: string; userBId: string };
const state: { matches: Pair[]; conversations: Conversation[] } = { matches: [], conversations: [] };
let failConversation = true;
const database = {
  async transaction<T>(work: (tx: unknown) => Promise<T>): Promise<T> {
    const staged = structuredClone(state);
    const tx = {
      insert(table: unknown) {
        return { values(rows: Array<Record<string, string>>) {
          if (table === matches) {
            const added = rows.map((row, i) => ({ id: `match-${i}`, male: row.maleUserId!, female: row.femaleUserId! }));
            staged.matches.push(...added);
            return { returning: async () => added };
          }
          assert.equal(table, conversations);
          return { onConflictDoNothing() {
            if (failConversation) throw new Error("conversation write failed");
            const added = rows.filter((row) => !staged.conversations.some((c) => c.userAId === row.userAId && c.userBId === row.userBId));
            staged.conversations.push(...added as Conversation[]);
            return { then: (resolve: (value: undefined) => void) => resolve(undefined), returning: async () => added };
          } };
        } };
      },
      select() { return { from() { return { leftJoin() { return { where: async () =>
        staged.matches.filter((m) => !staged.conversations.some((c) => c.userAId === m.male && c.userBId === m.female))
          .map((m) => ({ matchId: m.id, userAId: m.male, userBId: m.female })),
      }; } }; } }; },
    };
    const result = await work(tx);
    Object.assign(state, staged);
    return result;
  },
} as unknown as Parameters<typeof persistMatches>[0];
const rows = [{ roundId: "round", maleUserId: "male", femaleUserId: "female", score: 1 }];
await assert.rejects(persistMatches(database, rows), /conversation write failed/);
assert.equal(state.matches.length, 0);
assert.equal(state.conversations.length, 0);
failConversation = false;
assert.equal((await persistMatches(database, rows)).length, 1);
assert.equal(state.conversations.length, 1);
state.matches.push({ id: "legacy", male: "old-male", female: "old-female" });
assert.equal(await repairMissingConversations(database), 1);
assert.equal(await repairMissingConversations(database), 0);
assert.equal(state.conversations.length, 2);
console.log("PASS: atomic rollback, committed pair, legacy recovery, idempotent recovery");
