// Generates the README preview images in docs/ from the real rendering code.
// Usage: node scripts/make-docs.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SPECIES, RARITY } from '../shared/species.js';
import { renderPlant } from '../shared/plant.js';
import { renderGarden } from '../shared/garden.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'docs');
fs.mkdirSync(out, { recursive: true });

// Garden: a deterministic sample of mixed plants, with a few withered.
const sample = Array.from({ length: 36 }, (_, k) => ({
  species: SPECIES[(k * 7) % SPECIES.length].id, minutes: 25, tag: null,
  end: Date.UTC(2026, 0, 1) + k * 60000, status: k % 9 === 8 ? 'withered' : 'success',
}));
fs.writeFileSync(path.join(out, 'garden.svg'), renderGarden(sample).replace('<svg ', '<svg width="800" height="470" '));

// Species sheet, grouped by rarity.
const cols = 10, cell = 110, labelH = 22, headH = 34;
let y = 0, body = '';
for (const [key, r] of Object.entries(RARITY)) {
  const list = SPECIES.filter((s) => s.rarity === key);
  body += `<text x="8" y="${y + 24}" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="${r.color}">${r.label} (${list.length})</text>`;
  y += headH;
  list.forEach((s, i) => {
    const x = (i % cols) * cell, yy = y + Math.floor(i / cols) * (cell + labelH);
    body += renderPlant(s, 1, 'grown').replace('<svg ', `<svg x="${x}" y="${yy}" width="${cell}" height="${cell}" `);
    body += `<text x="${x + cell / 2}" y="${yy + cell + 12}" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle" fill="#22332a">${s.name}</text>`;
  });
  y += Math.ceil(list.length / cols) * (cell + labelH) + 8;
}
const W = cols * cell;
fs.writeFileSync(path.join(out, 'species.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}" viewBox="0 0 ${W} ${y}"><rect width="100%" height="100%" fill="#f4f1e8"/>${body}</svg>`);

// Growth stages and withering.
const sp = SPECIES.find((s) => s.id === 'blush');
const stages = [[0.05, 'growing', 'Seed'], [0.25, 'growing', 'Sprout'], [0.55, 'growing', 'Sapling'], [1, 'grown', 'Grown'], [1, 'withered', 'Withered']];
fs.writeFileSync(path.join(out, 'stages.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" width="${stages.length * 140}" height="170"><rect width="100%" height="100%" fill="#f4f1e8"/>` +
  stages.map(([p, st, label], i) => renderPlant(sp, p, st).replace('<svg ', `<svg x="${i * 140}" y="0" width="140" height="140" `) +
    `<text x="${i * 140 + 70}" y="158" font-family="system-ui, sans-serif" font-size="13" text-anchor="middle" fill="#22332a">${label}</text>`).join('') + '</svg>');

console.log('Wrote docs/garden.svg, docs/species.svg, docs/stages.svg');
