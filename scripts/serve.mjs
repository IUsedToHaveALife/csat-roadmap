import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
const port = Number(process.env.PORT || 8785), host = '127.0.0.1';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
http.createServer((request, response) => {
  let pathname; try { pathname = decodeURIComponent(new URL(request.url, `http://${host}`).pathname); } catch { response.writeHead(400).end(); return; }
  const file = path.resolve(root, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
  if (file !== root && !file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404).end('Not found'); return; }
  response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cache-Control', pathname.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache');
  response.writeHead(200); if (request.method === 'HEAD') response.end(); else fs.createReadStream(file).pipe(response);
}).listen(port, host, () => console.log(`CSAT roadmap preview: http://${host}:${port}/`));
