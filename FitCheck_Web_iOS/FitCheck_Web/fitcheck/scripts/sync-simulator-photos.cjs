/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

function syncPhotos({ root = path.resolve(__dirname, '..'), run = execFileSync, dryRun = false } = {}) {
    const folder = path.join(root, 'public/item-photos');
    const stateFile = path.join(root, '.expo/simulator-photo-imports.json');
    const devices = JSON.parse(run('xcrun', ['simctl', 'list', 'devices', 'booted', '--json'], { encoding: 'utf8' }));
    const booted = Object.values(devices.devices).flat().filter((device) => device.state === 'Booted');
    if (booted.length !== 1) throw new Error('Open exactly one iOS Simulator, then run this command again.');
    const device = booted[0];
    let state = {};
    if (fs.existsSync(stateFile)) state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    const imported = new Set(state[device.udid] || []);
    const files = fs.readdirSync(folder).filter((name) => /\.(jpe?g|png|webp|gif)$/i.test(name)).sort();
    let added = 0;
    for (const name of files) {
        const file = path.join(folder, name);
        const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
        if (imported.has(hash)) continue;
        if (!dryRun) {
            run('xcrun', ['simctl', 'addmedia', device.udid, file], { encoding: 'utf8' });
            imported.add(hash);
            state[device.udid] = [...imported];
            fs.mkdirSync(path.dirname(stateFile), { recursive: true });
            fs.writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n');
        }
        added++;
        console.log(`${dryRun ? 'Would import' : 'Imported'}: ${name}`);
    }
    console.log(`${device.name}: ${added} ${dryRun ? 'pending' : 'new'} photo(s).`);
    return added;
}

if (require.main === module) {
    const watch = process.argv.includes('--watch');
    const dryRun = process.argv.includes('--dry-run');
    const root = path.resolve(__dirname, '..');
    const sync = () => {
        try {
            execFileSync(process.execPath, [path.join(__dirname, 'refresh-public-photos.cjs')], { stdio: 'inherit' });
            syncPhotos({ root, dryRun });
        } catch (error) {
            console.error(error.stderr?.toString().trim() || error.message);
            if (!watch) process.exitCode = 1;
        }
    };
    sync();
    if (watch) {
        let timer;
        fs.watch(path.join(root, 'public/item-photos'), () => {
            clearTimeout(timer);
            timer = setTimeout(sync, 1000);
        });
        console.log('Watching public/item-photos. Add images here; press Ctrl+C to stop.');
    }
}

module.exports = { syncPhotos };
