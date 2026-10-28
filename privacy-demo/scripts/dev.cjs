// Start both processes from either workspace entry point; do not expose LAN APIs.
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const root = path.resolve(__dirname, '..');
const backend = path.join(root, 'ai-model');
const python = path.join(backend, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach(child => child.kill());
  process.exitCode = code;
}
function start(command, args, cwd) {
  const child = spawn(command, args, { cwd, stdio: 'inherit', windowsHide: true });
  children.push(child);
  child.on('error', error => { console.error(error.message); stop(1); });
  child.on('exit', code => { if (!stopping) stop(code || 0); });
  return child;
}
async function health() {
  try {
    const result = await fetch('http://127.0.0.1:8000/health', { signal: AbortSignal.timeout(1000) });
    return result.ok && (await result.json()).app === 'fitcheck-privacy';
  } catch { return false; }
}
async function main() {
  if (!fs.existsSync(python)) throw new Error('Create ai-model/.venv and install ai-model/requirements.txt first. See ai-model/README.md.');
  if (!await health()) {
    start(python, ['-m', 'uvicorn', 'server:app', '--host', '127.0.0.1', '--port', '8000', '--no-access-log'], backend);
    console.log('Starting privacy backend and loading the activity model...');
    let ready = false;
    for (let i = 0; i < 60 && !stopping; i++) {
      if (await health()) { ready = true; break; }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    if (!ready || stopping) throw new Error('Backend did not start. Check the error above and whether port 8000 is in use.');
  }
  console.log('Privacy backend ready. Open http://localhost:8082 for the app.');
  const expo = require.resolve('expo/bin/cli');
  start(process.execPath, [expo, 'start', '--port', '8082', ...process.argv.slice(2)], root);
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
main().catch(error => { console.error(error.message); stop(1); });
