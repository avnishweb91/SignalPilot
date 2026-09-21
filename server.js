import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const paytmBase = 'https://developer.paytmmoney.com';

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function paytmRead(pathname, options = {}) {
  const token = process.env.PAYTM_JWT_TOKEN;
  if (!token) throw new Error('PAYTM_JWT_TOKEN is not configured');
  const response = await fetch(`${paytmBase}${pathname}`, {
    ...options,
    headers: { ...(options.headers || {}), 'x-jwt-token': token, accept: 'application/json' }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Paytm Money API ${response.status}: ${body.message || body.displayMessage || 'request failed'}`);
  return body;
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/status') {
    return json(res, 200, { mode: 'read-only', broker: 'Paytm Money', configured: Boolean(process.env.PAYTM_JWT_TOKEN), liveOrdersEnabled: false, note: 'Market data only. No order endpoints are wired.' });
  }
  if (url.pathname === '/api/account') {
    try { return json(res, 200, { ok: true, account: await paytmRead('/accounts/v1/user/details') }); }
    catch (error) { return json(res, 503, { ok: false, error: error.message }); }
  }
  if (url.pathname === '/api/historical') {
    const symbol = url.searchParams.get('symbol') || 'RELIANCE';
    const fromDate = url.searchParams.get('fromDate') || '2026-09-01';
    const toDate = url.searchParams.get('toDate') || '2026-09-21';
    const payload = { cont: 'false', exchange: 'NSE', fromDate, instType: 'ES', interval: 'DAY', symbol, toDate };
    try { return json(res, 200, { ok: true, symbol, data: await paytmRead('/data/v1/price-charts/sym', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }) }); }
    catch (error) { return json(res, 503, { ok: false, symbol, error: error.message, setup: 'Add PAYTM_JWT_TOKEN to .env after completing Paytm Money authentication.' }); }
  }
  if (url.pathname === '/' || url.pathname === '/index.html') {
    const html = await readFile(path.join(root, 'public', 'index.html'), 'utf8');
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(html);
  }
  if (url.pathname === '/health') return json(res, 200, { ok: true });
  res.writeHead(404); res.end('Not found');
}

http.createServer((req, res) => route(req, res).catch(error => json(res, 500, { ok: false, error: error.message }))).listen(port, () => console.log(`SignalPilot running at http://localhost:${port}`));
