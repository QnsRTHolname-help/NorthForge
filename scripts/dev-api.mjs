import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const args = ['node_modules/tsx/dist/cli.mjs'];
if (existsSync('.env.local')) args.push('--env-file=.env.local');
args.push('server/dev-server.ts');

const proc = spawn(process.execPath, args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
proc.on('exit', (code) => process.exit(code ?? 0));
process.on('SIGINT', () => { proc.kill(); process.exit(0); });
process.on('SIGTERM', () => { proc.kill(); process.exit(0); });
