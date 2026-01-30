import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    const authUrl =
      "https://id.twitch.tv/oauth2/authorize" +
      "?client_id=" + process.env.TWITCH_CLIENT_ID +
      "&redirect_uri=https://commands.bromeo.live/api/admin/twitch-token" +
      "&response_type=code" +
      "&scope=moderation:read channel:read:vips";

    return NextResponse.redirect(authUrl);
  }

  const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: "https://commands.bromeo.live/api/admin/twitch-token",
    }),
  });

  const data = await tokenRes.json();

  return NextResponse.json({
    refresh_token: data.refresh_token,
    scopes: data.scope,
    note: "Kopieer de refresh_token en zet hem in Coolify als TWITCH_BROADCASTER_REFRESH_TOKEN. Daarna deze route VERWIJDEREN.",
  });
}
