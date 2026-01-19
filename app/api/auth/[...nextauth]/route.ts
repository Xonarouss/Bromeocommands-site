import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// NextAuth route handlers for the App Router (Next.js 13+)
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
