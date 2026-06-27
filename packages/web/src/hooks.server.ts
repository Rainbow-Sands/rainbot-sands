import type { Handle } from "@sveltejs/kit";
import { verifySession } from "$lib/server/session";

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get("session");
  event.locals.user = token ? verifySession(token) : null;
  return resolve(event);
};
