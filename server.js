import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import serverEntry from './dist/server/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.join(__dirname, 'dist', 'client');

const MIME_TYPES = {
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json',
  '.txt': 'text/plain',
};

function getContentType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

async function serveStaticFile(req, res, filePath) {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      throw new Error('Not a file');
    }

    const contentType = getContentType(filePath);
    const fileBuffer = await fs.readFile(filePath);

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': fileBuffer.length,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    res.end(fileBuffer);
    return true;
  } catch {
    return false;
  }
}

function isStaticAsset(pathname) {
  return pathname.startsWith('/assets/') || pathname === '/favicon.ico' || pathname.endsWith('.css') || pathname.endsWith('.js') || pathname.endsWith('.json') || pathname.endsWith('.png') || pathname.endsWith('.jpg') || pathname.endsWith('.jpeg') || pathname.endsWith('.svg') || pathname.endsWith('.ico') || pathname.endsWith('.woff2') || pathname.endsWith('.woff') || pathname.endsWith('.ttf') || pathname.endsWith('.eot') || pathname.endsWith('.map');
}

async function handleRequest(req, res) {
  const host = req.headers.host || 'localhost';
  const url = new URL(req.url ?? '/', `http://${host}`);
  const pathname = decodeURIComponent(url.pathname);

  if (isStaticAsset(pathname)) {
    const assetPath = path.join(clientDir, pathname);
    if (assetPath.startsWith(clientDir) && (await serveStaticFile(req, res, assetPath))) {
      return;
    }
  }

  try {
    const request = new Request(url.href, {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method ?? '') ? null : Readable.toWeb(req),
    });

    const response = await serverEntry.fetch(request);
    const headers = Object.fromEntries(response.headers.entries());
    res.writeHead(response.status, headers);

    if (response.body) {
      const bodyStream = Readable.fromWeb(response.body);
      bodyStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

const port = Number(process.env.PORT ?? 8080);
const server = http.createServer(handleRequest);

server.listen(port, () => {
  console.log(`AgriGov AI server running on http://localhost:${port}`);
});
