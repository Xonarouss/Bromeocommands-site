import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getBroadcasterId, helix } from '@/lib/twitchServer';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.twitchUserId as string | undefined;
  if (!userId) {
    return Response.json({ isVip: false }, { status: 200 });
  }

  type HelixResp = { data: Array<{ user_id: string }>; pagination?: any };
  const broadcasterId = getBroadcasterId();

  try {
    const res = await helix<HelixResp>(
      `/channels/vips?broadcaster_id=${encodeURIComponent(broadcasterId)}&user_id=${encodeURIComponent(userId)}`
    );
    return Response.json({ isVip: (res.data?.length ?? 0) > 0 }, { status: 200 });
  } catch {
    return Response.json({ isVip: false }, { status: 200 });
  }
}
