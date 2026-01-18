'use client';

export default function RoleBadge({
  label,
  active,
  loading
}: {
  label: string;
  active: boolean;
  loading?: boolean;
}) {
  return (
    <span
      className={
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ' +
        (loading
          ? 'border-bromeo-gold/25 bg-zinc-950/30 text-zinc-400'
          : active
            ? 'border-bromeo-gold/50 bg-bromeo-gold/15 text-bromeo-gold'
            : 'border-bromeo-gold/25 bg-zinc-950/30 text-zinc-400')
      }
      title={loading ? 'Checking…' : active ? `${label}: yes` : `${label}: no`}
    >
      {label}
    </span>
  );
}
