import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const nodes = JSON.parse(fs.readFileSync(path.join(root, 'src/roadmap.json'), 'utf8')).nodes;
const expectedIds = [['A', 9], ['B', 15], ['C', 12], ['D', 7]].flatMap(([prefix, count]) => Array.from({ length: count }, (_, i) => prefix + String(i + 1).padStart(2, '0')));
assert.deepEqual(nodes.map(node => node.id).sort(), expectedIds.sort(), 'Only the 43 approved topics belong in the roadmap.');
const byId = new Map(nodes.map(node => [node.id, node]));
const tagIds = { A01:54,A02:55,A03:56,A04:57,A05:58,A06:59,A07:60,A08:61,A09:62,B01:63,B02:95,B03:94,B04:64,B05:65,B06:66,B07:67,B08:68,B09:69,B10:70,B11:71,B12:72,B13:73,B14:74,B15:75,C01:76,C02:77,C03:78,C04:79,C05:80,C06:81,C07:82,C08:83,C09:84,C10:85,C11:86,C12:96,D01:87,D02:88,D03:89,D04:90,D05:91,D06:92,D07:93 };
const visiting = new Set(), visited = new Set();
function visit(id) {
  assert(!visiting.has(id), 'Prerequisite cycle at ' + id);
  if (visited.has(id)) return;
  visiting.add(id);
  for (const prerequisite of byId.get(id).prerequisites) { assert(byId.has(prerequisite), 'Unknown prerequisite ' + prerequisite); visit(prerequisite); }
  visiting.delete(id); visited.add(id);
}
for (const node of nodes) {
  assert.equal(node.rank, node.id.startsWith('D') ? 'C' : node.id[0]);
  assert(node.title && node.summary && node.lane && node.details.length);
  assert.equal(new Set(node.prerequisites).size, node.prerequisites.length);
  assert.equal(node.csatoj_tag_id, tagIds[node.id], 'Incorrect CSATOJ tag for ' + node.id);
  assert.equal(node.csatoj_url, `https://csatoj.vn/problems/?tag=${tagIds[node.id]}&point_start=&point_end=`);
  visit(node.id);
}
assert.equal(nodes.filter(node => node.id.startsWith('D')).reduce((count, node) => count + node.details.length, 0), 56);
const assetsDir = path.join(publicDir, 'assets');
const assets = fs.readdirSync(assetsDir);
assert.equal(assets.length, 8, 'Only current generated assets should be published.');
for (const name of assets) {
  const content = fs.readFileSync(path.join(assetsDir, name));
  assert.equal(name.split('.')[1], crypto.createHash('sha256').update(content).digest('hex').slice(0, 12));
  if (name.endsWith('.json')) assert.deepEqual(JSON.parse(content).nodes, nodes);
  if (name.endsWith('.js')) {
    assert.equal(spawnSync(process.execPath, ['--check', path.join(assetsDir, name)]).status, 0, 'JavaScript syntax');
    for (const reference of content.toString().matchAll(/(?:roadmap|diagram-(?:full|A|B|C|DP))\.[a-f0-9]{12}\.(?:json|svg)/g)) assert(assets.includes(reference[0]));
  }
  if (name.endsWith('.svg')) {
    const view = name.split('.')[0].slice(8);
    const wanted = nodes.filter(node => view === 'full' || (view === 'DP' ? node.id.startsWith('D') : node.rank === view)).map(node => node.id).sort();
    const actual = [...content.toString().matchAll(/id="graph(?:-|&#45;)([A-D]\d\d)"/g)].map(match => match[1]).sort();
    assert.deepEqual(actual, wanted, 'Diagram scope ' + view);
  }
}
const html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
assert(!html.includes('%%'), 'Unresolved build placeholder');
for (const reference of html.matchAll(/(?:href|src)="\.\/(assets\/[^"#]+|favicon\.svg)"/g)) assert(fs.existsSync(path.join(publicDir, reference[1])));
assert(!/<(?:script|link)[^>]+(?:src|href)="https?:/i.test(html), 'No external runtime dependency');
console.log('PASS: 43 topics, acyclic prerequisites, 43 CSATOJ mappings, D01–D07 and all generated assets.');
