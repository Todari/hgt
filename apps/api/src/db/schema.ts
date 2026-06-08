import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  date,
  primaryKey,
  unique,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

/**
 * Relational translation of the legacy Mongo document model
 * (`legacy/hgt-server/models`).
 *
 * Mongo array fields (hobbies / keywords / target / ex_partner) become
 * many-to-many join tables; single ObjectID references (height / smoke /
 * religion / mbti / partner) become foreign-key columns.
 */

/* ----------------------------- properties ----------------------------- */
// Lookup table of selectable option values (age, smoke, mbti, height, ...).
export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(),
    value: text("value").notNull(),
  },
  (t) => ({
    typeValueUnique: unique("properties_type_value_unique").on(t.type, t.value),
  }),
);

/* -------------------------------- users ------------------------------- */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Auth — session token rotated on each sign-in, sent via Authorization header.
  session: text("session"),

  // Basics (required)
  name: text("name").notNull(),
  studentId: text("student_id").notNull().unique(),
  major: text("major").notNull(),
  gender: boolean("gender").notNull(), // true = 남 (verified from portal)
  army: boolean("army"), // true = 군필, null = 미입력 (not provided by the portal)
  age: integer("age").notNull(),
  academicStatus: text("academic_status"), // 재학 / 휴학 / 졸업 ... (재학생 gating)

  // Optional profile
  description: text("description"),
  explore: boolean("explore").notNull().default(false),

  // Single-value property references
  heightId: uuid("height_id").references(() => properties.id),
  smokeId: uuid("smoke_id").references(() => properties.id),
  religionId: uuid("religion_id").references(() => properties.id),
  mbtiId: uuid("mbti_id").references(() => properties.id),

  // Matching preferences
  canCc: boolean("can_cc").notNull().default(false), // allow same-major matches
  targetMinAge: integer("target_min_age"),
  targetMaxAge: integer("target_max_age"),

  // Result of matching
  partnerId: uuid("partner_id").references((): AnyPgColumn => users.id),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ----------------------- many-to-many: properties --------------------- */
export const userHobbies = pgTable(
  "user_hobbies",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.propertyId] }) }),
);

export const userKeywords = pgTable(
  "user_keywords",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.propertyId] }) }),
);

/* ------------------------- many-to-many: users ------------------------ */
// Desired match targets.
export const userTargets = pgTable(
  "user_targets",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetUserId: uuid("target_user_id")
      .notNull()
      .references((): AnyPgColumn => users.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.targetUserId] }) }),
);

// Excluded partners.
export const userExPartners = pgTable(
  "user_ex_partners",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    exPartnerUserId: uuid("ex_partner_user_id")
      .notNull()
      .references((): AnyPgColumn => users.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.exPartnerUserId] }) }),
);

/* =====================================================================
 * Keyword-based matching (current product design)
 * ===================================================================== */

/** Curated keyword catalog. `category` enables partial-credit scoring. */
export const keywords = pgTable("keywords", {
  id: uuid("id").primaryKey().defaultRandom(),
  value: text("value").notNull().unique(),
  category: text("category").notNull(), // 성격 / 취미 / 관심사 / 라이프스타일 / 가치관
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Keywords describing the user themselves. */
export const userSelfKeywords = pgTable(
  "user_self_keywords",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    keywordId: uuid("keyword_id")
      .notNull()
      .references(() => keywords.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.keywordId] }) }),
);

/** Keywords describing the user's ideal partner. */
export const userIdealKeywords = pgTable(
  "user_ideal_keywords",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    keywordId: uuid("keyword_id")
      .notNull()
      .references(() => keywords.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.keywordId] }) }),
);

/** Weekly matching round. One row per week (keyed by the week's Monday). */
export const matchRounds = pgTable("match_rounds", {
  id: uuid("id").primaryKey().defaultRandom(),
  weekStart: date("week_start").notNull().unique(),
  status: text("status").notNull().default("pending"), // pending / completed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** A 1:1 (남↔여) match produced by a round. */
export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roundId: uuid("round_id")
      .notNull()
      .references(() => matchRounds.id, { onDelete: "cascade" }),
    maleUserId: uuid("male_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    femaleUserId: uuid("female_user_id")
      .notNull()
      .references((): AnyPgColumn => users.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // each user is matched at most once per round
    roundMaleUnique: unique("matches_round_male_unique").on(t.roundId, t.maleUserId),
    roundFemaleUnique: unique("matches_round_female_unique").on(t.roundId, t.femaleUserId),
  }),
);
