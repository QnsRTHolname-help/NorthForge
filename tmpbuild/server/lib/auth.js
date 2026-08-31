import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';
import { ApiError, bearer } from './http.js';
export async function authenticate(req) {
    const token = bearer(req);
    if (!token)
        throw new ApiError(401, 'UNAUTHENTICATED', 'Sign in required.');
    const supabase = createClient(env.supabaseUrl(), env.supabaseAnonKey());
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
        throw new ApiError(401, 'UNAUTHENTICATED', 'Invalid or expired session.');
    }
    // Profile lookup through an authenticated client scoped to this user.
    const scoped = createClient(env.supabaseUrl(), token);
    const { data: profile, error: pErr } = await scoped
        .from('profiles')
        .select('role, client_id')
        .eq('id', data.user.id)
        .single();
    if (pErr || !profile) {
        throw new ApiError(403, 'NO_PROFILE', 'User profile not provisioned.');
    }
    return {
        userId: data.user.id,
        role: profile.role === 'admin' ? 'admin' : 'client',
        clientId: profile.client_id ?? null,
    };
}
export function requireAdmin(p) {
    if (p.role !== 'admin') {
        throw new ApiError(403, 'FORBIDDEN', 'Administrator access required.');
    }
}
/** Tenant guard: clients may only touch their own resources. */
export function assertTenant(p, clientId) {
    if (p.role === 'admin')
        return;
    if (p.clientId !== clientId) {
        throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this resource.');
    }
}
