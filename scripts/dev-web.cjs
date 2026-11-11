/* global __dirname, fetch, AbortSignal, setTimeout */
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { parseEnv } = require('node:util');

const root = path.resolve(__dirname, '..');
const backend = path.join(root, 'services', 'privacy');
function readEnv(directory) {
  const file = path.join(directory, '.env.local');
  return fs.existsSync(file) ? parseEnv(fs.readFileSync(file, 'utf8')) : {};
}
const appEnv = { ...readEnv(root), ...process.env };
const backendEnv = { ...appEnv, ...readEnv(backend), ...process.env };
const children = new Set();
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}
function start(command, args, cwd, env) {
  const child = spawn(command, args, { cwd, env, stdio: 'inherit', windowsHide: true });
  children.add(child);
  child.on('error', error => { console.error(error.message); stop(1); });
  child.on('exit', code => { children.delete(child); if (!stopping) stop(code || 0); });
  return child;
}
async function healthy(origin) {
  try {
    const response = await fetch(`${origin}/health`, { signal: AbortSignal.timeout(1000) });
    return response.ok && (await response.json()).app === 'fitcheck-privacy';
  } catch { return false; }
}
async function main() {
  const backendOnly = process.argv.includes('--backend-only');
  const configured = appEnv.EXPO_PUBLIC_SUPABASE_URL && appEnv.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const origin = new URL(appEnv.EXPO_PUBLIC_ACTIVITY_API_URL || 'http://127.0.0.1:8000');
  const local = ['localhost', '127.0.0.1'].includes(origin.hostname);
  if (backendOnly && (!configured || !local)) throw new Error('Configure local privacy service settings in fitcheck/.env.local first.');
  if (configured && local && !await healthy(origin.origin)) {
    const relativePython = process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python';
    const python = [path.join(root, '.venv', relativePython), path.join(root, 'privacy-demo', 'ai-model', '.venv', relativePython)].find(file => fs.existsSync(file));
    if (!python) throw new Error('Create fitcheck/.venv and install services/privacy/requirements.txt to run the privacy backend.');
    start(python, ['-m', 'uvicorn', 'server:app', '--host', '127.0.0.1', '--port', origin.port || '8000', '--no-access-log'], backend, backendEnv);
    console.log('Starting the privacy backend...');
    let ready = false;
    for (let attempt = 0; attempt < 60 && !stopping; attempt++) {
      if (await healthy(origin.origin)) { ready = true; break; }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    if (!ready || stopping) throw new Error('Privacy backend failed to start. Check the error above and the configured port.');
  }
  if (backendOnly) { console.log('Privacy backend ready.'); return; }
  if (!configured) console.log('Cloud privacy is unconfigured. Add the public Supabase settings to fitcheck/.env.local to enable it.');
  console.log('Starting integrated FitCheck at http://localhost:8081');
  start(process.execPath, [require.resolve('expo/bin/cli'), 'start', '--web', '--port', '8081', ...process.argv.slice(2)], root, appEnv);
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
main().catch(error => { console.error(error.message); stop(1); });
