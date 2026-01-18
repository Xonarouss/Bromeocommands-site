type TokenCache = { accessToken: string; expiresAt: number } | null;

let broadcasterToken: TokenCache = null;

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function getBroadcasterId(): string {
  return requiredEnv('TWITCH_BROADCASTER_ID');
}

export async function getBroadcasterAccessToken(): Promise<string> {
  const clientId = requiredEnv('TWITCH_CLIENT_ID');
  const clientSecret = requiredEnv('TWITCH_CLIENT_SECRET');
  const refreshToken = requiredEnv('TWITCH_BROADCASTER_REFRESH_TOKEN');

  const now = Date.now();
  if (broadcasterToken && broadcasterToken.expiresAt - 30_000 > now) {
    return broadcasterToken.accessToken;
  }

  const url = new URL('https://id.twitch.tv/oauth2/token');
  url.searchParams.set('grant_type', 'refresh_token');
  url.searchParams.set('refresh_token', refreshToken);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('client_secret', clientSecret);

  const res = await fetch(url.toString(), { method: 'POST' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to refresh broadcaster token: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number; refresh_token?: string };

  broadcasterToken = {
    accessToken: data.access_token,
    expiresAt: now + data.expires_in * 1000
  };

  // NOTE: Twitch may rotate refresh tokens. We don't auto-persist.
  // If Twitch returns a new refresh_token, update your env var manually.
  return broadcasterToken.accessToken;
}

export async function helix<T>(path: string, opts: { userToken?: string } = {}): Promise<T> {
  const clientId = requiredEnv('TWITCH_CLIENT_ID');
  const token = opts.userToken ?? (await getBroadcasterAccessToken());

  const res = await fetch(`https://api.twitch.tv/helix${path}`, {
    headers: {
      'Client-Id': clientId,
      Authorization: `Bearer ${token}`
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Helix error ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}
