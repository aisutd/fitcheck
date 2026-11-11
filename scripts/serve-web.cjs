/* global __dirname */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, process.env.WEB_DIST || (fs.existsSync(path.resolve(__dirname, '../dist-web/index.html')) ? '../dist-web' : '../dist'));
if (!fs.existsSync(path.join(root, 'index.html'))) { console.error('Run npm run build:web before starting the preview.'); process.exit(1); }
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.ttf': 'font/ttf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png', '.ico': 'image/x-icon' };
http.createServer((req, res) => {
 let pathname;
 try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
 let file = path.resolve(root, '.' + pathname);
 if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
 if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
 res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
 const stream = fs.createReadStream(file);
 stream.on('error', () => { if (!res.headersSent) res.writeHead(404); res.end(); });
 stream.pipe(res);
}).listen(Number(process.env.WEB_PORT || 8081), '127.0.0.1');
