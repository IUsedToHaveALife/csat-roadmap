import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { instance } = process.env.CSAT_DEPS ? require(path.join(process.env.CSAT_DEPS, '@viz-js/viz')) : require('@viz-js/viz');
const source = JSON.parse(fs.readFileSync(path.join(root, 'src/roadmap.json'), 'utf8'));
const topics = source.nodes;
const output = path.join(root, 'public'), assets = path.join(output, 'assets');
fs.mkdirSync(assets, { recursive: true });
const hash = value => crypto.createHash('sha256').update(value).digest('hex').slice(0, 12);
function emit(prefix, extension, content) { const name = `${prefix}.${hash(content)}.${extension}`; fs.writeFileSync(path.join(assets, name), content); return name; }
const colors = { A: '#235749', B: '#2358a0', C: '#785026' }, fills = { A: '#edf5f0', B: '#edf3fc', C: '#faf2e7' };
const titles = { A: 'A · NỀN TẢNG C++', B: 'B · HSG PHƯỜNG / XÃ', C: 'C · HSG TỈNH, CHUYÊN TIN' };
const byId = new Map(topics.map(topic => [topic.id, topic]));
const wrap = (value, maximum = 24) => { const lines = ['']; for (const word of value.split(' ')) { const index = lines.length - 1; if ((lines[index] + ' ' + word).length > maximum && lines[index]) lines.push(word); else lines[index] = (lines[index] + ' ' + word).trim(); } return lines.join('\n'); };
function ancestor(a, b, seen = new Set()) { if (a === b) return true; if (seen.has(b)) return false; seen.add(b); return byId.get(b).prerequisites.some(id => ancestor(a, id, seen)); }
function graph(ids, title) {
  const scope = new Set(ids), nodes = topics.filter(topic => scope.has(topic.id));
  let dot = 'digraph CSAT {graph [rankdir=TB,bgcolor="white",pad=0.28,nodesep=0.32,ranksep=0.55,splines=polyline,fontname="Arial",fontsize=19];node [shape=box,style="rounded,filled",fontname="Arial",fontsize=16,margin="0.15,0.12",penwidth=1.3];edge [penwidth=1.1,arrowsize=0.65];';
  const rank = nodes[0].rank;
  dot += `subgraph cluster_${rank}{label=${JSON.stringify(title)};fontcolor="${colors[rank]}";color="${colors[rank]}";style=rounded;penwidth=1.3;margin=20;`;
  for (const node of nodes) {
    const external = node.prerequisites.filter(id => !scope.has(id) || byId.get(id).rank !== rank);
    const label = node.id + '\n' + wrap(node.title) + (node.id.startsWith('D') ? '\n' + wrap(node.summary, 34) : '') + (external.length ? '\nNền: ' + external.join(', ') : '');
    dot += `${node.id} [id="graph-${node.id}",label=${JSON.stringify(label)},color="${colors[rank]}",fillcolor="${fills[rank]}",fontcolor="#172d39"];`;
  }
  dot += '}';
  for (const node of nodes) for (const prerequisite of node.prerequisites.filter(id => !node.prerequisites.some(other => id !== other && ancestor(id, other)))) if (scope.has(prerequisite) && byId.get(prerequisite).rank === rank) dot += `${prerequisite}->${node.id}[id="edge-${prerequisite}-${node.id}",color="${colors[rank]}"];`;
  return dot + '}';
}
function cleanSvg(svg) { return svg.replace(/<\?xml[^>]+>|<!DOCTYPE[^>]+>|<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').trim(); }
const viz = await instance(), diagrams = {}, raw = {};
for (const view of ['A', 'B', 'C', 'DP']) {
  const ids = topics.filter(topic => view === 'DP' ? topic.id.startsWith('D') : topic.rank === view).map(topic => topic.id);
  raw[view] = cleanSvg(viz.renderString(graph(ids, view === 'DP' ? 'QUY HOẠCH ĐỘNG · D01–D07 (LỚP C)' : titles[view]), { format: 'svg', engine: 'dot' })).replace('id="graph0"', `id="diagram-${view}"`).replace('id="clust1"', `id="class-${view}"`);
}
const dimensions = ['A', 'B', 'C'].map(id => ({ id, box: raw[id].match(/viewBox="([^"]+)"/)[1].split(' ').map(Number) }));
const width = Math.max(...dimensions.map(item => item.box[2])) + 32; let y = 72, parts = [];
for (const { id, box } of dimensions) { parts.push(raw[id].replace(/<svg\b[^>]*>/, `<svg x="${(width - box[2]) / 2}" y="${y}" width="${box[2]}" height="${box[3]}" viewBox="${box.join(' ')}">`)); y += box[3] + 22; if (id !== 'C') { parts.push(`<path d="M${width / 2},${y - 10}v24m-5,-7l5,7l5,-7" fill="none" stroke="#b6c4cc" stroke-width="2"/>`); y += 38; } }
raw.full = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${y}" viewBox="0 0 ${width} ${y}"><rect width="100%" height="100%" fill="white"/><text x="${width / 2}" y="28" text-anchor="middle" font-family="Arial" font-size="22" fill="#1b2d3a">CSAT · LỘ TRÌNH A → B → C</text><text x="${width / 2}" y="52" text-anchor="middle" font-family="Arial" font-size="14" fill="#52636f">Mũi tên trong lớp chỉ thứ tự học; nền từ lớp trước ghi bằng mã trong ô.</text>${parts.join('')}</svg>`;
for (const [view, svg] of Object.entries(raw)) diagrams[view] = emit('diagram-' + view, 'svg', svg);
const data = emit('roadmap', 'json', JSON.stringify({ nodes: topics }));
const style = emit('styles', 'css', fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8').replace(/\s+/g, ' ').trim());
const script = emit('app', 'js', fs.readFileSync(path.join(root, 'src/app.js'), 'utf8').replace('%%DATA_FILE%%', data).replace('%%DIAGRAM_FILES%%', JSON.stringify(diagrams)));
const html = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8').replaceAll('%%CSS%%', style).replaceAll('%%JS%%', script).replaceAll('%%DATA%%', data).replaceAll('%%FULL_SVG%%', diagrams.full);
fs.writeFileSync(path.join(output, 'index.html'), html);
fs.writeFileSync(path.join(output, '.nojekyll'), '');
fs.writeFileSync(path.join(output, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#235749"/><path d="m18 13-11 11 11 11m12-22 11 11-11 11" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>');
// Only remove old fingerprinted assets generated inside this project's public/assets.
const keep = new Set([data, style, script, ...Object.values(diagrams)]);
for (const name of fs.readdirSync(assets)) if (/^(app|styles|roadmap|diagram-(?:full|A|B|C|DP))\.[a-f0-9]{12}\.(js|css|json|svg)$/.test(name) && !keep.has(name)) fs.unlinkSync(path.join(assets, name));
const summary = { files: keep.size + 3, topics: topics.length, data, style, script, diagrams, bytes: Object.fromEntries([...keep].map(name => [name, fs.statSync(path.join(assets, name)).size])) };
fs.mkdirSync(path.join(root, 'test-results'), { recursive: true }); fs.writeFileSync(path.join(root, 'test-results/build.json'), JSON.stringify(summary, null, 2));
console.log('Built static site:', summary.files, 'files;', topics.length, 'topics;', Object.values(summary.bytes).reduce((a, b) => a + b, 0), 'asset bytes.');
