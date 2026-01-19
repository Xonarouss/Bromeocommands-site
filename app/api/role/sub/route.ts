import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBroadcasterId, helix } from "@/lib/twitchServer";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.twitchUserId;
    const userToken = (session as any)?.accessToken as string | undefined;
    if (!userId || !userToken) return Response.json({ isSub: false });

    const broadcasterId = getBroadcasterId();
    const data = await helix<{ data: any[] }>(
      `/subscriptions/user?broadcaster_id=${encodeURIComponent(broadcasterId)}&user_id=${encodeURIComponent(userId)}`,
      { userToken }
    );
    return Response.json({ isSub: Array.isArray(data.data) && data.data.length > 0 });
  } catch (e: any) {
    return Response.json({ isSub: false, error: e?.message ?? "error" }, { status: 200 });
  }
}
