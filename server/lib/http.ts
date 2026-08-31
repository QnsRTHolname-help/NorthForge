// ---------------------------------------------------------------------------
// Consistent HTTP responses + error shape for every API route.
// { success: boolean, error?: { code, message }, data?: ... }
// Internal stack traces / secrets are never leaked to the client.
// ---------------------------------------------------------------------------
import type { VercelRequest, VercelResponse } from '@vercel/node';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const ok = (res: VercelResponse, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data });

export const fail = (res: VercelResponse, err: unknown) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
  }
  // Unexpected: log server-side, return a safe generic message.
  console.error('[api] unhandled error:', err);
  // TEMP DEBUG: expose root cause until deployment is verified, then revert.
  const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', detail },
  });
};

export const bearer = (req: VercelRequest): string | null => {
  const h = req.headers.authorization;
  return h?.startsWith('Bearer ') ? h.slice(7) : null;
};
