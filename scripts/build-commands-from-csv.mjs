import fs from 'fs';
import path from 'path';

/**
 * Build data/commands.json from data/commands.csv.
 *
 * CSV format expected:
 *   Command,Description,Category,Aliases,Permissions
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

function normalizeCategory(cat) {
  return (cat || '').toString().trim().toLowerCase();
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
  category: header.indexOf('category'),
  aliases: header.indexOf('aliases'),
  permissions: header.indexOf('permissions')
};

// Hard requirement: categories must be explicitly defined in the CSV.
if (idx.command < 0 || idx.description < 0 || idx.category < 0 || idx.permissions < 0) {
  console.error(
    'commands.csv must include the columns: Command, Description, Category, Aliases, Permissions (case-insensitive).'
  );
  process.exit(1);
}

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
  const category = normalizeCategory(get(r, 'category'));

  if (!category) {
    console.error(`Missing Category for command: ${command}`);
    process.exit(1);
  }

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
