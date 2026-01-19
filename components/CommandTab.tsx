'use client';

import commands from '@/data/commands.json';
import { useMemo, useState } from 'react';
import CommandCard from '@/components/CommandCard';

type Role = 'viewer' | 'sub' | 'vip' | 'mod' | 'broadcaster';

type RolesState = { isMod: boolean; isVip: boolean; isSub: boolean; checked: boolean };

type CommandItem = {
  command: string;
  title: string;
  description: string;
  roles: Role[];
  category?: string;
  cooldownSec?: number;
  aliases?: string[];
};

function userHasRole(req: Role, roles: RolesState): boolean {
  if (req === 'viewer') return true;
  if (req === 'sub') return roles.isSub;
  if (req === 'vip') return roles.isVip;
  if (req === 'mod') return roles.isMod;
  // broadcaster isn't detectable via this site unless you log in as broadcaster;
  // treat broadcaster as mod for visibility purposes.
  if (req === 'broadcaster') return roles.isMod;
  return false;
}

export default function CommandTab({ roles }: { roles: RolesState }) {
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');

  const filtered = useMemo(() => {
    const items = (commands as unknown as CommandItem[]).slice();
    const query = q.trim().toLowerCase();

    return items
      .filter((it) => {
        if (!query) return true;
        return (
          it.command.toLowerCase().includes(query) ||
          it.title.toLowerCase().includes(query) ||
          it.description.toLowerCase().includes(query) ||
          (it.aliases ?? []).some((a) => a.toLowerCase().includes(query)) ||
          (it.category ?? '').toLowerCase().includes(query)
        );
      })
      .filter((it) => {
        if (roleFilter === 'all') return true;
        return it.roles.includes(roleFilter);
      })
      .sort((a, b) => a.command.localeCompare(b.command));
  }, [q, roleFilter]);

  const roleChips: Array<{ id: Role | 'all'; label: string }> = [
    { id: 'all', label: 'Alles' },
    { id: 'viewer', label: 'Viewer' },
    { id: 'sub', label: 'Sub' },
    { id: 'vip', label: 'VIP' },
    { id: 'mod', label: 'Mod' },
    { id: 'broadcaster', label: 'Broadcaster' }
  ];

  return (
    <section className="card-gold p-5 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-extrabold">Commands</h2>
          <p className="text-sm text-zinc-300 mt-1">
            Zoek op command, categorie of beschrijving. Log in om te zien welke rol jij hebt.
          </p>
        </div>
        <div className="w-full md:w-[420px]">
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek… (bijv: spin, shoutout, wheel)" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {roleChips.map((c) => (
          <button
            key={c.id}
            onClick={() => setRoleFilter(c.id)}
            className={
              'rounded-full border px-4 py-2 text-xs font-semibold transition ' +
              (roleFilter === c.id
                ? 'border-bromeo-gold bg-bromeo-gold/15 text-bromeo-gold'
                : 'border-bromeo-gold/25 bg-zinc-950/30 text-zinc-200 hover:bg-zinc-950/45')
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((it) => {
          const allowed = it.roles.every((r) => userHasRole(r, roles));
          return <CommandCard key={it.command} item={it} allowed={allowed} rolesChecked={roles.checked} />;
        })}
      </div>

      {filtered.length === 0 ? <div className="mt-8 text-sm text-zinc-400">Geen matches.</div> : null}
    </section>
  );
}
