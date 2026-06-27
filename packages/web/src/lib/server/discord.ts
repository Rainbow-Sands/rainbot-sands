const DISCORD_API = "https://discord.com/api";

function clientId(): string {
  const value = process.env.DISCORD_APPLICATION_ID;
  if (!value)
    throw new Error("Missing required environment variable: DISCORD_APPLICATION_ID");
  return value;
}

function clientSecret(): string {
  const value = process.env.DISCORD_CLIENT_SECRET;
  if (!value)
    throw new Error("Missing required environment variable: DISCORD_CLIENT_SECRET");
  return value;
}

export function getAuthorizeUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
    state,
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCode(
  code: string,
  redirectUri: string
): Promise<{ access_token: string }> {
  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId(),
      client_secret: clientSecret(),
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  return res.json() as Promise<{ access_token: string }>;
}

export async function fetchDiscordUser(
  accessToken: string
): Promise<{ id: string; username: string; global_name: string | null }> {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch Discord user: ${res.status}`);
  return res.json() as Promise<{
    id: string;
    username: string;
    global_name: string | null;
  }>;
}
