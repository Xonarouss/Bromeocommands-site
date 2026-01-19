import fs from 'fs';
import path from 'path';

/**
 * Build data/*.json from data/commands.csv.
 *
 * Supported CSV headers (case-insensitive):
 *   Command,Description,Type,Category,Aliases,Permissions,Cost,Notes
 *
 * Type values:
 *   - command (chat command)
 *   - bits (bits reward)
 *   - channelpoints (channel points reward)
 *
 * Backwards compatibility:
 *   If Type/Category/Cost are missing, we still build commands.json only.
 */

const root = process.cwd();
const csvPath = path.join(root, 'data', 'commands.csv');

const outCommandsPath = path.join(root, 'data', 'commands.json');
const outBitsPath = path.join(root, 'data', 'bits.json');
const outPointsPath = path.join(root, 'data', 'points.json');

if (!fs.existsSync(csvPath)) {
  process.exit(0);
}

function splitList(s) {
  return (s || '')
    .split(/[;,]/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function normalizeCommand(cmd) {
  const c = (cmd || '').trim();
  if (!c) return '';
  return c.startsWith('!') ? c : `!${c}`;
}

function titleFromCommand(command) {
  const raw = (command || '').replace(/^!/, '').trim();
  if (!raw) return command;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function normalizeType(t) {
  const v = (t || '').trim().toLowerCase();
  if (!v) return '';
  if (v === 'cmd' || v === 'command' || v === 'commands') return 'command';
  if (v === 'bit' || v === 'bits') return 'bits';
  if (v === 'points' || v === 'point' || v === 'kanaalpunten' || v === 'channelpoints' || v === 'channel_points') return 'channelpoints';
  return v; // keep for error reporting
}

function parseCost(s) {
  const raw = (s ?? '').toString().trim();
  if (!raw) return 0;
  const n = Number(raw.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function rolesFromPermissions(permStr) {
  // IMPORTANT:
  // If the permission list contains "Anyone" / "Follower" etc., the command is effectively public.
  // Many exports include "Streamer" even when it's available to everyone.
  const p = splitList(permStr).map((x) => x.toLowerCase());

  const isPublic = p.some((x) =>
    x.includes('anyone') ||
    x.includes('everyone') ||
    x.includes('all') ||
    x.includes('follower') ||
    x.includes('viewer')
  );
  if (isPublic) return ['viewer'];

  const isBroadcaster = p.some((x) => x.includes('streamer') || x.includes('broadcaster'));
  const isMod = p.some((x) => x === 'mod' || x.includes('moderator'));
  const isVip = p.some((x) => x.includes('vip'));
  const isSub = p.some((x) => x.includes('sub'));

  if (isBroadcaster && !isMod && !isVip && !isSub) return ['broadcaster'];
  if (isMod) return ['mod'];
  if (isVip) return ['vip'];
  if (isSub) return ['sub'];
  return ['viewer'];
}

// Tiny CSV parser (good enough for simple, comma-separated files).
// Handles quoted fields.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (ch === '\n') {
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
      continue;
    }

    if (ch === '\r') continue;
    field += ch;
  }

  row.push(field);
  if (row.length > 1 || row[0] !== '') rows.push(row);
  return rows;
}

const csvText = fs.readFileSync(csvPath, 'utf8');
const rows = parseCsv(csvText);
if (!rows.length) process.exit(0);

const header = rows[0].map((h) => (h || '').trim().toLowerCase());
const idx = {
  command: header.indexOf('command'),
  description: header.indexOf('description'),
  type: header.indexOf('type'),
  category: header.indexOf('category'),
  aliases: header.indexOf('aliases'),
  permissions: header.indexOf('permissions'),
  cost: header.indexOf('cost'),
  notes: header.indexOf('notes')
};

function get(row, key) {
  const i = idx[key];
  if (i < 0) return '';
  return (row[i] ?? '').toString().trim();
}

const hasType = idx.type >= 0;
const hasCategory = idx.category >= 0;
const hasCost = idx.cost >= 0;

const commandItems = [];
const bitsItems = [];
const pointsItems = [];

for (const r of rows.slice(1)) {
  const rawCommand = get(r, 'command');
  if (!rawCommand) continue;

  const description = get(r, 'description');
  const aliases = splitList(get(r, 'aliases'));
  const roles = rolesFromPermissions(get(r, 'permissions'));
  const notes = get(r, 'notes');

  // Backwards compat: if Type is missing, everything is treated as a chat command.
  const type = hasType ? normalizeType(get(r, 'type')) : 'command';

  if (hasType && type !== 'command' && type !== 'bits' && type !== 'channelpoints') {
    throw new Error(`Unknown Type "${get(r, 'type')}" for row Command="${rawCommand}"`);
  }

  if (type === 'command') {
    const command = normalizeCommand(rawCommand);
    if (!command) continue;

    const category = hasCategory ? get(r, 'category') : '';

    commandItems.push({
      command,
      title: titleFromCommand(command),
      description,
      roles,
      ...(category ? { category } : {}),
      ...(aliases.length ? { aliases } : {}),
      cooldownSec: 0
    });
    continue;
  }

  // rewards (bits / channel points)
  const title = rawCommand.trim();
  const category = hasCategory ? get(r, 'category') : '';
  const cost = hasCost ? parseCost(get(r, 'cost')) : 0;

  const base = {
    title,
    description,
    ...(notes ? { notes } : {}),
    ...(category ? { category } : {})
  };

  if (type === 'bits') {
    bitsItems.push({
      ...base,
      costBits: cost
    });
  } else if (type === 'channelpoints') {
    pointsItems.push({
      ...base,
      costPoints: cost
    });
  }
}

// De-dupe on command (keep first occurrence)
const seen = new Set();
const dedupedCommands = [];
for (const it of commandItems) {
  const key = it.command.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  dedupedCommands.push(it);
}

dedupedCommands.sort((a, b) => a.command.localeCompare(b.command));
bitsItems.sort((a, b) => (a.costBits ?? 0) - (b.costBits ?? 0) || a.title.localeCompare(b.title));
pointsItems.sort((a, b) => (a.costPoints ?? 0) - (b.costPoints ?? 0) || a.title.localeCompare(b.title));

fs.writeFileSync(outCommandsPath, JSON.stringify(dedupedCommands, null, 2) + '\n', 'utf8');
console.log(`Built ${path.relative(root, outCommandsPath)} from ${path.relative(root, csvPath)} (${dedupedCommands.length} commands)`);

// Only overwrite bits/points files if the CSV supports it (Type column present) OR if they already exist.
const shouldWriteRewards = hasType || fs.existsSync(outBitsPath) || fs.existsSync(outPointsPath);
if (shouldWriteRewards) {
  fs.writeFileSync(outBitsPath, JSON.stringify(bitsItems, null, 2) + '\n', 'utf8');
  fs.writeFileSync(outPointsPath, JSON.stringify(pointsItems, null, 2) + '\n', 'utf8');
  console.log(`Built ${path.relative(root, outBitsPath)} (${bitsItems.length} items) and ${path.relative(root, outPointsPath)} (${pointsItems.length} items)`);
}
