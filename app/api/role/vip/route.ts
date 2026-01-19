import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBroadcasterId, helix } from "@/lib/twitchServer";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.twitchUserId;
    if (!userId) return Response.json({ isVip: false });

    const broadcasterId = getBroadcasterId();
    const data = await helix<{ data: any[] }>(
      `/channels/vips?broadcaster_id=${encodeURIComponent(broadcasterId)}&user_id=${encodeURIComponent(userId)}`
    );
    return Response.json({ isVip: Array.isArray(data.data) && data.data.length > 0 });
  } catch (e: any) {
    return Response.json({ isVip: false, error: e?.message ?? "error" }, { status: 200 });
  }
}
