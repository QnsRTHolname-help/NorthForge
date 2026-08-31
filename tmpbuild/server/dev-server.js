// ---------------------------------------------------------------------------
// Local dev API server — serves the serverless functions (e.g. /api/chat)
// on http://localhost:3000 so the Vite dev proxy works with `npm run dev`.
//
//   npm run dev:api
//
// Env is loaded from .env.local. This is a thin shim: the real logic lives in
// chat.ts (identical to the deployed Vercel function).
// ---------------------------------------------------------------------------
import { createServer } from 'node:http';
import chatHandler from '../api/chat.js';
const PORT = Number(process.env.PORT || 3000);
function shim(req, res) {
    const vreq = req;
    vreq.socket = req.socket;
    const vres = {
        status(code) {
            res.statusCode = code;
            return vres;
        },
        json(body) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(body));
            return vres;
        },
        setHeader: (k, v) => res.setHeader(k, v),
    };
    return { vreq, vres };
}
createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        return res.end();
    }
    const url = req.url || '';
    let body = undefined;
    if (req.method === 'POST') {
        const chunks = [];
        for await (const c of req)
            chunks.push(c);
        try {
            body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
        }
        catch {
            res.statusCode = 400;
            return res.end(JSON.stringify({ success: false, error: { code: 'VALIDATION', message: 'Invalid JSON body.' } }));
        }
    }
    const { vreq, vres } = shim(req, res);
    vreq.body = body;
    vreq.url = url;
    vreq.method = req.method;
    if (url.startsWith('/api/chat')) {
        return chatHandler(vreq, vres);
    }
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: `No local handler for ${url}` } }));
}).listen(PORT, () => {
    console.log(`[dev-api] listening on http://localhost:${PORT} (chat: POST /api/chat)`);
});
