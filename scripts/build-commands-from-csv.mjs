import fs from 'fs';
import path from 'path';

/**
 * Build data/commands.json from data/commands.csv.
 *
 * CSV format expected:
 *   Command,Description,Aliases,Permissions
 */

const root = process.cwd();
const csvPath = path.join(root, 'data', 'commands.csv');
const outPath = path.join(root, 'data', 'commands.json');

if (!fs.existsSync(csvPath)) {
  // Nothing to do.
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

function rolesFromPermissions(permStr) {
  const p = splitList(permStr).map((x) => x.toLowerCase());

  // Map the StreamElements-ish permission names to our site roles.
  const isBroadcaster = p.some((x) => x.includes('streamer'));
  const isMod = p.some((x) => x === 'mod' || x.includes('moderator'));
  const isVip = p.some((x) => x.includes('vip'));
  const isSub = p.some((x) => x.includes('sub'));

  // If it’s limited to streamer only, keep it strict.
  if (isBroadcaster && !isMod && !isVip && !isSub) return ['broadcaster'];
  if (isMod) return ['mod'];
  if (isVip) return ['vip'];
  if (isSub) return ['sub'];
  return ['viewer'];
}

function inferCategory(command, description) {
  const c = (command || '').toLowerCase();
  const d = (description || '').toLowerCase();

  if (c.startsWith('!challenge') || c.startsWith('!spin') || d.includes('challenge')) return 'challenge';
  if (c.startsWith('!so') || c.includes('shoutout') || d.includes('shoutout')) return 'mod-tools';
  if (c.startsWith('!ban') || c.startsWith('!timeout') || d.includes('ban') || d.includes('timeout')) return 'moderation';
  if (/^!\d+$/.test(c)) return 'wheel';
  if (c.includes('points') || d.includes('kanaalpunten')) return 'points';
  if (c.includes('bits') || d.includes('bits')) return 'bits';
  return 'general';
}

function titleFromCommand(command) {
  // Friendly title: strip leading ! and capitalize first letter.
  const raw = (command || '').replace(/^!/, '').trim();
  if (!raw) return command;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
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
      // Skip empty last line
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
      continue;
    }

    if (ch === '\r') continue;
    field += ch;
  }

  // last row
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
  aliases: header.indexOf('aliases'),
  permissions: header.indexOf('permissions')
};

function get(row, key) {
  const i = idx[key];
  if (i < 0) return '';
  return (row[i] ?? '').toString().trim();
}

const items = [];
for (const r of rows.slice(1)) {
  const command = normalizeCommand(get(r, 'command'));
  if (!command) continue;

  const description = get(r, 'description');
  const aliases = splitList(get(r, 'aliases'));
  const roles = rolesFromPermissions(get(r, 'permissions'));
  const category = inferCategory(command, description);

  items.push({
    command,
    title: titleFromCommand(command),
    description,
    roles,
    category,
    cooldownSec: 0,
    ...(aliases.length ? { aliases } : {})
  });
}

// De-dupe on command (keep first occurrence)
const seen = new Set();
const deduped = [];
for (const it of items) {
  const key = it.command.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  deduped.push(it);
}

deduped.sort((a, b) => a.command.localeCompare(b.command));

fs.writeFileSync(outPath, JSON.stringify(deduped, null, 2) + '\n', 'utf8');
console.log(`Built ${path.relative(root, outPath)} from ${path.relative(root, csvPath)} (${deduped.length} commands)`);
