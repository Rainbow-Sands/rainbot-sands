import { redirect } from "@sveltejs/kit";
import { randomBytes } from "node:crypto";
import { getAuthorizeUrl } from "$lib/server/discord";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = ({ url, cookies }) => {
  const state = randomBytes(16).toString("hex");
  cookies.set("oauth_state", state, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
  });

  const redirectUri = `${url.origin}/auth/callback`;
  throw redirect(302, getAuthorizeUrl(redirectUri, state));
};
