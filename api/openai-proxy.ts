// Transparent OpenAI proxy (flat Vercel Serverless Function — no bracketed
// catch-all filename, which the CRA/vc-build pipeline fails to detect).
//
// The frontend OpenAI SDK targets `${origin}/api/openai`, so it requests paths
// like `/api/openai/chat/completions`. A rewrite in vercel.json maps
//   /api/openai/(.*)  ->  /api/openai-proxy?path=$1
// so this function receives the OpenAI sub-path in `req.query.path`.
//
// Required server-side env var (NOT prefixed with REACT_APP_):
//   OPENAI_API_KEY
// Optional:
//   OPENAI_ORG_ID

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the server' });
    return;
  }

  const raw = req.query?.path;
  const subPath = Array.isArray(raw) ? raw.join('/') : (raw || '');
  if (!subPath) {
    res.status(400).json({ error: 'Missing OpenAI sub-path' });
    return;
  }

  const targetUrl = `https://api.openai.com/v1/${subPath}`;

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(process.env.OPENAI_ORG_ID
          ? { 'OpenAI-Organization': process.env.OPENAI_ORG_ID }
          : {}),
      },
      body:
        req.method === 'GET' || req.method === 'HEAD'
          ? undefined
          : JSON.stringify(req.body ?? {}),
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.status(upstream.status).send(text);
  } catch (error: any) {
    console.error('OpenAI proxy error:', error);
    res.status(502).json({
      error: 'OpenAI proxy request failed',
      message: error?.message || 'Unknown error',
    });
  }
}
