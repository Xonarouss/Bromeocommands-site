import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getBroadcasterId, helix } from '@/lib/twitchServer';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.twitchUserId as string | undefined;
  const userToken = (session as any)?.accessToken as string | undefined;

  if (!userId || !userToken) {
    return Response.json({ isSub: false }, { status: 200 });
  }

  // This endpoint requires a *user* access token with user:read:subscriptions.
  type HelixResp = { data: Array<any> };
  const broadcasterId = getBroadcasterId();

  try {
    const res = await helix<HelixResp>(
      `/subscriptions/user?broadcaster_id=${encodeURIComponent(broadcasterId)}&user_id=${encodeURIComponent(userId)}`,
      { userToken }
    );
    return Response.json({ isSub: (res.data?.length ?? 0) > 0 }, { status: 200 });
  } catch {
    return Response.json({ isSub: false }, { status: 200 });
  }
}
