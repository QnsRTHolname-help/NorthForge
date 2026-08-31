// ---------------------------------------------------------------------------
// Server-side environment access. NEVER import this from src/ (browser code).
// ---------------------------------------------------------------------------
export function requireEnv(name) {
    const v = process.env[name];
    if (!v)
        throw Object.assign(new Error(`Missing env ${name}`), { code: 'SERVER_MISCONFIGURED' });
    return v;
}
export const env = {
    supabaseUrl: () => requireEnv('SUPABASE_URL'),
    supabaseAnonKey: () => requireEnv('SUPABASE_ANON_KEY'),
    serviceRoleKey: () => requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    hermesApiUrl: () => process.env.HERMES_API_URL ?? '',
    hermesApiKey: () => process.env.HERMES_API_KEY ?? '',
    hermesCallbackSecret: () => process.env.HERMES_CALLBACK_SECRET ?? '',
    nemotronApiUrl: () => process.env.NEMOTRON_API_URL ?? '',
    nemotronApiKey: () => process.env.NEMOTRON_API_KEY ?? '',
    nemotronModel: () => process.env.NEMOTRON_MODEL ?? '',
};
/** True only when the Hermes integration contract has actually been provided. */
export const hermesConfigured = () => Boolean(env.hermesApiUrl() && env.hermesApiKey());
