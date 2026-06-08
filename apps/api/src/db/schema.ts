import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
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
