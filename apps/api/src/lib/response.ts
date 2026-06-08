import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * Helpers for the `{ success, data }` envelope (legacy `structs.HttpResponse`).
 */

export const ok = (c: Context, data: unknown, status: ContentfulStatusCode = 200) =>
  c.json({ success: true, data }, status);

export const fail = (
  c: Context,
  message: string,
  status: ContentfulStatusCode = 400,
) => c.json({ success: false, data: { message } }, status);
