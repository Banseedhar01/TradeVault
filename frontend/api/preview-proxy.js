const METHODS = new Set(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);

const fail = (response, status, code, message) =>
  response.status(status).json({ success: false, error: { code, message } });

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  // Production uses the public production API directly. Never expose this
  // protected-backend proxy on the frontend's public production deployment.
  if (process.env.VERCEL_ENV !== 'preview') {
    return fail(response, 404, 'NOT_FOUND', 'Not found');
  }

  if (!METHODS.has(request.method)) {
    response.setHeader('Allow', [...METHODS].join(', '));
    return fail(response, 405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
  }

  const origin = process.env.PREVIEW_BACKEND_URL;
  const secret = process.env.PREVIEW_BACKEND_BYPASS_SECRET;
  if (!origin || !secret) {
    return fail(response, 503, 'PREVIEW_NOT_CONFIGURED', 'Preview backend is not configured');
  }

  try {
    const incoming = new URL(request.url, 'https://frontend.invalid');
    // Vercel rewrites carry the full nested API path to this single function.
    const rewrittenPath = request.query?.__preview_path ?? incoming.searchParams.get('__preview_path');
    if (rewrittenPath !== null && rewrittenPath !== undefined) {
      if (typeof rewrittenPath !== 'string') {
        return fail(response, 404, 'NOT_FOUND', 'Not found');
      }
      incoming.pathname = new URL(`/api/${rewrittenPath}`, incoming.origin).pathname;
    }
    incoming.searchParams.delete('__preview_path');
    const isHealth = incoming.pathname === '/api/health';
    if (!isHealth && !/^\/api\/(firms|accounts|trades|analytics)(\/|$)/.test(incoming.pathname)) {
      return fail(response, 404, 'NOT_FOUND', 'Not found');
    }

    const backend = new URL(origin);
    if (backend.protocol !== 'https:' || backend.username || backend.password) {
      return fail(response, 503, 'PREVIEW_NOT_CONFIGURED', 'Preview backend is not configured');
    }
    const upstream = new URL(isHealth ? '/health' : incoming.pathname, backend.origin);
    upstream.search = incoming.search;

    const headers = {
      Accept: 'application/json',
      'x-vercel-protection-bypass': secret,
    };
    if (request.headers['content-type']) {
      headers['Content-Type'] = request.headers['content-type'];
    }
    const hasBody = request.method !== 'GET' && request.method !== 'HEAD' && request.body !== undefined;
    const body = hasBody
      ? (typeof request.body === 'string' || Buffer.isBuffer(request.body)
        ? request.body : JSON.stringify(request.body))
      : undefined;

    const result = await fetch(upstream, {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(45_000),
    });

    // Authentication redirects and HTML error pages are not API responses.
    // Do not pass backend cookies, Location headers, or bypass credentials
    // back to the browser.
    const contentType = result.headers.get('content-type') ?? '';
    if (result.status >= 300 && result.status < 400 ||
        result.status !== 204 && !contentType.includes('application/json')) {
      return fail(response, 502, 'PREVIEW_UPSTREAM_ERROR', 'Preview backend returned an invalid API response');
    }
    response.setHeader('Content-Type', 'application/json');
    return response.status(result.status).send(await result.text());
  } catch {
    return fail(response, 502, 'PREVIEW_UPSTREAM_ERROR', 'Preview backend is unavailable');
  }
}
