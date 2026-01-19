import { getServerSession } from 'next-auth/next';
import Providers from './providers';
import { authOptions } from '@/lib/auth';
import AppShell from '@/components/AppShell';

export default async function Page() {
  const session = await getServerSession(authOptions);
  return (
    <Providers session={session}>
      <AppShell />
    </Providers>
  );
}
