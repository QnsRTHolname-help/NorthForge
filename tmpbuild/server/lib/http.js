export class ApiError extends Error {
    status;
    code;
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
export const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
export const fail = (res, err) => {
    if (err instanceof ApiError) {
        return res.status(err.status).json({
            success: false,
            error: { code: err.code, message: err.message },
        });
    }
    // Unexpected: log server-side, return a safe generic message.
    console.error('[api] unhandled error:', err);
    return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
    });
};
export const bearer = (req) => {
    const h = req.headers.authorization;
    return h?.startsWith('Bearer ') ? h.slice(7) : null;
};
