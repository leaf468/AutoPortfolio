// Transparent OpenAI proxy (Vercel Serverless Function).
// The frontend OpenAI SDK is pointed at `${origin}/api/openai`, so requests hit
// this same-origin endpoint (no CORS) and the real API key stays on the server.
//
// Required env var (server-side, NOT prefixed with REACT_APP_):
//   OPENAI_API_KEY   - your OpenAI secret key
// Optional:
//   OPENAI_ORG_ID    - OpenAI organization id

export const config = { runtime: 'nodejs' };

export default async function handler(req: any, res: any) {
  // Preflight (same-origin in production, but harmless to answer)
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

  // Rebuild the OpenAI path, e.g. ["chat", "completions"] -> "chat/completions"
  const segments = req.query?.path;
  const subPath = Array.isArray(segments) ? segments.join('/') : (segments || '');
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
