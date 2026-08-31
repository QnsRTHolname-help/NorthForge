// ---------------------------------------------------------------------------
// Service-role Supabase client. Server-only — used by API routes for jobs,
// events, dispatch and anything that must bypass RLS in a controlled way.
// ---------------------------------------------------------------------------
import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';
let admin = null;
export function supabaseAdmin() {
    if (!admin) {
        admin = createClient(env.supabaseUrl(), env.serviceRoleKey(), {
            auth: { persistSession: false, autoRefreshToken: false },
        });
    }
    return admin;
}
