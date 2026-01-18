import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getBroadcasterId, helix } from '@/lib/twitchServer';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.twitchUserId as string | undefined;
  if (!userId) return NextResponse.json({ isMod: false });

  try {
    const broadcasterId = getBroadcasterId();
    const data = await helix<{ data: Array<{ user_id: string }> }>(
      `/moderation/moderators?broadcaster_id=${encodeURIComponent(broadcasterId)}&user_id=${encodeURIComponent(userId)}`
    );
    return NextResponse.json({ isMod: (data.data?.length ?? 0) > 0 });
  } catch {
    // Fail closed
    return NextResponse.json({ isMod: false });
  }
}
