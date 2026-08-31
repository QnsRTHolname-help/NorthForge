// ---------------------------------------------------------------------------
// Hermes adapter — THE single integration point with the external engine.
//
// IMPORTANT (master spec): Hermes is a separate server-side automation engine
// reached over HTTP. Its real API contract (auth scheme, submit endpoint,
// status/progress model, callback signing, cancel/pause support) is NOT yet
// known. Until the project owner supplies it, this adapter deliberately does
// NOTHING except report honestly:
//   * dispatch()      -> throws HERMES_NOT_CONFIGURED
//   * cancel()        -> throws CANCEL_NOT_SUPPORTED (unknown capability)
//   * health()        -> returns { status: 'UNKNOWN' }
// There is NO simulated execution, NO fake progress, NO fake job IDs.
//
// When the Hermes contract arrives (see docs/HERMES_INTEGRATION.md), implement
// it in HttpHermesAdapter below without touching any route or UI code.
// ---------------------------------------------------------------------------
import { createHmac, timingSafeEqual } from 'node:crypto';
import { hermesConfigured } from './env.js';
import { ApiError } from './http.js';
class UnconfiguredHermesAdapter {
    name = 'unconfigured';
    async dispatch() {
        throw new ApiError(503, 'HERMES_NOT_CONFIGURED', 'Hermes integration is not yet configured. Your job is safely queued and will be dispatched once the automation engine is connected.');
    }
    async cancel() {
        throw new ApiError(409, 'CANCEL_NOT_SUPPORTED', 'Cancellation is not available for this automation.');
    }
    async health() {
        return { status: 'UNKNOWN', detail: 'Hermes API contract not yet configured.' };
    }
}
/**
 * HMAC-SHA256 signature helpers for the Hermes -> website callback channel.
 * Signature = hex(hmac_sha256(secret, `${timestamp}.${rawBody}`)) in
 * X-Hermes-Signature. The timestamp window rejects replayed callbacks.
 */
export function verifyCallbackSignature(rawBody, signature, secret, timestampHeader, maxSkewMs = 5 * 60_000) {
    if (!signature || !timestampHeader)
        return { valid: false, reason: 'missing signature headers' };
    const ts = Number(timestampHeader);
    if (!Number.isFinite(ts))
        return { valid: false, reason: 'bad timestamp' };
    if (Math.abs(Date.now() - ts) > maxSkewMs)
        return { valid: false, reason: 'timestamp outside window (replay?)' };
    const expected = createHmac('sha256', secret).update(`${ts}.${rawBody}`).digest();
    const given = Buffer.from(signature, 'hex');
    if (given.length !== expected.length)
        return { valid: false, reason: 'signature length mismatch' };
    return { valid: timingSafeEqual(given, expected) };
}
export const hermes = hermesConfigured()
    ? new UnconfiguredHermesAdapter() // replaced by HttpHermesAdapter once contract is known
    : new UnconfiguredHermesAdapter();
