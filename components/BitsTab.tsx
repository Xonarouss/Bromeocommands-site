'use client';

import bits from '@/data/bits.json';
import { useMemo, useState } from 'react';

type RolesState = { isMod: boolean; isVip: boolean; isSub: boolean; checked: boolean };

type BitsItem = {
  title: string;
  costBits: number;
  description: string;
  notes?: string;
};

export default function BitsTab({ roles }: { roles: RolesState }) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const items = (bits as unknown as BitsItem[]).slice();
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter((it) =>
      `${it.title} ${it.description} ${it.notes ?? ''} ${it.costBits}`.toLowerCase().includes(query)
    );
  }, [q]);

  return (
    <section className="card-gold p-5 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-extrabold">Bits</h2>
          <p className="text-sm text-zinc-300 mt-1">Wat er gebeurt als je bits gebruikt in BromeoLIVE.</p>
        </div>
        <div className="w-full md:w-[420px]">
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek… (bijv: 300, challenge)" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((it) => (
          <div key={it.title} className="rounded-2xl border border-bromeo-gold/25 bg-zinc-950/35 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-extrabold">{it.title}</div>
                <div className="mt-1 text-sm text-zinc-300">{it.description}</div>
              </div>
              <span className="badge-gold">{it.costBits} bits</span>
            </div>
            {it.notes ? <div className="mt-3 text-xs text-zinc-400">{it.notes}</div> : null}
          </div>
        ))}
      </div>

      {filtered.length === 0 ? <div className="mt-8 text-sm text-zinc-400">Geen matches.</div> : null}
    </section>
  );
}
