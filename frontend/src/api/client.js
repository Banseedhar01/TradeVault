const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api';

export class ApiError extends Error {
  constructor(message, status = 0, code = 'REQUEST_FAILED') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function validationMessage(detail) {
  if (typeof detail === 'string') return detail;
  if (!Array.isArray(detail)) return undefined;
  return detail.slice(0, 3).map(item => {
    const field = item.loc?.filter(part => part !== 'body').join('.');
    return `${field ? `${field}: ` : ''}${item.msg || 'Invalid value'}`;
  }).join('; ');
}

export async function apiRequest(path, options = {}, message = 'The request failed.') {
  const isWrite = options.method && !['GET', 'HEAD'].includes(options.method);
  const uncertain = `${message} Could not confirm the change. Refresh before retrying.`;
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: options.signal ?? AbortSignal.timeout(20_000),
    });
  } catch {
    throw new ApiError(isWrite
      ? uncertain
      : `${message} Check your connection and retry.`, 0, 'NETWORK_ERROR');
  }
  if (response.status === 204 && options.method === 'DELETE') return;
  let result;
  try { result = await response.json(); } catch {
    throw new ApiError(isWrite ? uncertain : `${message} The server returned an unexpected response.`, response.status, 'INVALID_RESPONSE');
  }
  if (!response.ok || result?.success !== true) {
    // Validation messages are safe to display. Database/driver errors from
    // legacy error envelopes must not expose internals or connection details.
    const detail = response.status >= 400 && response.status < 500
      ? validationMessage(result?.detail) : undefined;
    throw new ApiError(detail || message, response.status, result?.error?.code || 'REQUEST_FAILED');
  }
  if (result.data === undefined || result.data === null) {
    throw new ApiError(isWrite ? uncertain : `${message} The server returned an unexpected response.`, response.status, 'INVALID_RESPONSE');
  }
  return result.data;
}
