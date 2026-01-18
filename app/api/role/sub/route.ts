import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getBroadcasterId, helix } from '@/lib/twitchServer';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.twitchUserId as string | undefined;
  const userToken = (session as any)?.accessToken as string | undefined;
  if (!userId || !userToken) return NextResponse.json({ isSub: false });

  try {
    const broadcasterId = getBroadcasterId();
    // Requires the logged-in user's token with scope user:read:subscriptions
    const data = await helix<{ data: any[] }>(
      `/subscriptions/user?broadcaster_id=${encodeURIComponent(broadcasterId)}&user_id=${encodeURIComponent(userId)}`,
      { userToken }
    );

    return NextResponse.json({ isSub: (data.data?.length ?? 0) > 0 });
  } catch {
    return NextResponse.json({ isSub: false });
  }
}
