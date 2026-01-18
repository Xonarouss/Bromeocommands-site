'use client';

import Image from 'next/image';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import CommandTab from '@/components/CommandTab';
import PointsTab from '@/components/PointsTab';
import BitsTab from '@/components/BitsTab';
import RoleBadge from '@/components/RoleBadge';

const TABS = [
  { id: 'commands', label: 'Commands' },
  { id: 'points', label: 'Kanaalpunten' },
  { id: 'bits', label: 'Bits' }
] as const;

export default function AppShell() {
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('commands');
  const [roles, setRoles] = useState<{ isMod: boolean; isVip: boolean; isSub: boolean; checked: boolean }>({
    isMod: false,
    isVip: false,
    isSub: false,
    checked: false
  });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!session?.user) {
        setRoles({ isMod: false, isVip: false, isSub: false, checked: false });
        return;
      }

      try {
        const [modRes, vipRes, subRes] = await Promise.all([
          fetch('/api/role/mod', { cache: 'no-store' }),
          fetch('/api/role/vip', { cache: 'no-store' }),
          fetch('/api/role/sub', { cache: 'no-store' })
        ]);

        const mod = await modRes.json();
        const vip = await vipRes.json();
        const sub = await subRes.json();
        if (cancelled) return;
        setRoles({
          isMod: !!mod.isMod,
          isVip: !!vip.isVip,
          isSub: !!sub.isSub,
          checked: true
        });
      } catch {
        if (cancelled) return;
        setRoles((r) => ({ ...r, checked: true }));
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  const headerRight = useMemo(() => {
    if (status === 'loading') {
      return <div className="text-sm text-zinc-400">Loading…</div>;
    }
    if (!session) {
      return (
        <button className="btn-primary" onClick={() => signIn('twitch')}>
          Log in met Twitch
        </button>
      );
    }
    return (
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2">
          <RoleBadge label="Mod" active={roles.isMod} loading={!roles.checked} />
          <RoleBadge label="VIP" active={roles.isVip} loading={!roles.checked} />
          <RoleBadge label="Sub" active={roles.isSub} loading={!roles.checked} />
        </div>
        <div className="flex items-center gap-2">
          {session.user?.image ? (
            <Image
              src={session.user.image}
              alt="avatar"
              width={32}
              height={32}
              className="rounded-full border border-bromeo-gold/40"
            />
          ) : null}
          <div className="hidden sm:block">
            <div className="text-sm font-semibold">{(session.user as any).displayName ?? session.user?.name ?? 'Twitch user'}</div>
            <div className="text-xs text-zinc-400">@{(session.user as any).login ?? '—'}</div>
          </div>
        </div>
        <button className="btn-ghost" onClick={() => signOut()}>
          Uitloggen
        </button>
      </div>
    );
  }, [session, status, roles]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-6">
          <header className="card-gold p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative h-12 w-12 md:h-14 md:w-14">
                  <Image src="/logo.png" alt="BromeoLIVE" fill className="object-contain" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
                    BromeoLIVE <span className="text-bromeo-gold">Command Center</span>
                  </h1>
                  <p className="text-sm text-zinc-300 mt-1">
                    Alles wat je kan activeren in chat: commands, kanaalpunten en bits — inclusief welke rollen wat mogen.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-3">
                <div className="flex md:hidden items-center gap-2">
                  <RoleBadge label="Mod" active={roles.isMod} loading={!roles.checked} />
                  <RoleBadge label="VIP" active={roles.isVip} loading={!roles.checked} />
                  <RoleBadge label="Sub" active={roles.isSub} loading={!roles.checked} />
                </div>
                {headerRight}
              </div>
            </div>
          </header>

          <div className="flex items-center gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={clsx(
                  'rounded-xl border px-4 py-2 text-sm font-semibold transition',
                  tab === t.id
                    ? 'border-bromeo-gold bg-bromeo-gold/15 text-bromeo-gold shadow-gold'
                    : 'border-bromeo-gold/25 bg-zinc-950/30 text-zinc-200 hover:bg-zinc-950/45'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'commands' ? <CommandTab roles={roles} /> : null}
          {tab === 'points' ? <PointsTab roles={roles} /> : null}
          {tab === 'bits' ? <BitsTab roles={roles} /> : null}

          <footer className="text-xs text-zinc-500 px-2 pb-10">
            <div className="flex flex-col gap-1">
              <div>
                Tip: gebruik de zoekbalk en filters om snel te vinden wat je nodig hebt. Als je inlogt met Twitch krijg je automatisch je rollen (mod/vip/sub) en zie je in één oogopslag wat jij kan.
              </div>
              <div className="text-zinc-600">
                Gemaakt voor BromeoLIVE — thema gebaseerd op het logo (goud/zwart).
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
