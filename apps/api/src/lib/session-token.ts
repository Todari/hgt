import { randomBytes } from "node:crypto";

/**
 * Create an opaque session token.
 *
 * The legacy server hashed `id + timestamp + static HASH_KEY` (SHA-256), which
 * is guessable if the key leaks. A 256-bit random token is unguessable and
 * carries no secret.
 */
export const createSessionToken = (): string => randomBytes(32).toString("hex");
