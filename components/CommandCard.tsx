'use client';

import { useState } from 'react';

type Role = 'viewer' | 'sub' | 'vip' | 'mod' | 'broadcaster';

type CommandItem = {
  command: string;
  title: string;
  description: string;
  roles: Role[];
  category?: string;
  cooldownSec?: number;
};

function prettyRole(r: Role) {
  if (r === 'viewer') return 'Viewer';
  if (r === 'sub') return 'Sub';
  if (r === 'vip') return 'VIP';
  if (r === 'mod') return 'Mod';
  if (r === 'broadcaster') return 'Broadcaster';
  return r;
}

export default function CommandCard({
  item,
  allowed,
  rolesChecked
}: {
  item: CommandItem;
  allowed: boolean;
  rolesChecked: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(item.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 900);
    } catch {
      // ignore
    }
  }

  const reqText = item.roles.map(prettyRole).join(' + ');

  return (
    <div className="relative rounded-2xl border border-bromeo-gold/25 bg-zinc-950/35 p-4 overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-zinc-400">Command</div>
          <div className="mt-1 font-mono text-bromeo-gold text-base md:text-lg font-bold">{item.command}</div>
        </div>
        <button onClick={copy} className="btn-ghost text-xs">
          {copied ? 'Gekopieerd' : 'Copy'}
        </button>
      </div>

      <div className="mt-3">
        <div className="text-base font-extrabold">{item.title}</div>
        <div className="mt-1 text-sm text-zinc-300">{item.description}</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="badge-gold">Rol: {reqText}</span>
        {item.category ? <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-950/40 px-3 py-1 text-xs text-zinc-300">{item.category}</span> : null}
        {typeof item.cooldownSec === 'number' && item.cooldownSec > 0 ? (
          <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-950/40 px-3 py-1 text-xs text-zinc-300">Cooldown: {item.cooldownSec}s</span>
        ) : null}
      </div>

      {!allowed ? (
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="card-gold w-full max-w-sm p-4">
            <div className="text-sm font-extrabold text-bromeo-gold">🔒 Niet beschikbaar</div>
            <div className="mt-1 text-sm text-zinc-200">
              {rolesChecked ? (
                <>
                  Dit is bedoeld voor: <span className="font-semibold">{reqText}</span>.
                </>
              ) : (
                <>Log in om je rol te checken.</>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
