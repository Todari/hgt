import type { PartnerUser } from "@hgt-client/contract";
import type { DbUser } from "../types";

/**
 * Strip private/internal fields before sending the user's OWN profile to the
 * client (session token, ops-only activity timestamp).
 */
export const toPublicUser = ({ session: _session, lastActiveAt: _lastActiveAt, ...rest }: DbUser) =>
  rest;

/**
 * Minimal shape another user (the matched partner) is allowed to see —
 * mirrors `partnerUserSchema` in the contract. Never expose `toPublicUser`
 * output (studentId, preferences, consent timestamps) to anyone but the
 * profile owner.
 */
export const toPartnerUser = (u: DbUser): PartnerUser => ({
  id: u.id,
  name: u.name,
  major: u.major,
  age: u.age,
  gender: u.gender,
  army: u.army,
  academicStatus: u.academicStatus,
  description: u.description,
});
