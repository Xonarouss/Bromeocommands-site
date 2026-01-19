import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getBroadcasterId, helix } from '@/lib/twitchServer';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.twitchUserId as string | undefined;
  if (!userId) {
    return Response.json({ isMod: false }, { status: 200 });
  }

  // Uses broadcaster token (server-side) so it works even if user token lacks mod scopes.
  type HelixResp = { data: Array<{ user_id: string }>; pagination?: any };
  const broadcasterId = getBroadcasterId();

  try {
    const res = await helix<HelixResp>(
      `/moderation/moderators?broadcaster_id=${encodeURIComponent(broadcasterId)}&user_id=${encodeURIComponent(userId)}`
    );
    return Response.json({ isMod: (res.data?.length ?? 0) > 0 }, { status: 200 });
  } catch {
    // Fail closed but don't break the UI.
    return Response.json({ isMod: false }, { status: 200 });
  }
}
