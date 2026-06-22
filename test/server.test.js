const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const fetch = global.fetch || require('node-fetch');

const appDir = path.resolve(__dirname, '..');
const dbFile = path.join(appDir, 'data.db');
const port = 4001;
const baseUrl = `http://127.0.0.1:${port}`;

function waitForServer(timeout = 10000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(baseUrl);
        if (res.ok) {
          clearInterval(interval);
          resolve();
        }
      } catch (err) {
        if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject(new Error('Timed out waiting for server')); 
        }
      }
    }, 250);
  });
}

function startServer() {
  return spawn(process.execPath, ['server.js'], {
    cwd: appDir,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function run() {
  if (fs.existsSync(dbFile)) {
    fs.unlinkSync(dbFile);
  }

  const server = startServer();
  server.stdout.on('data', (chunk) => process.stdout.write(chunk));
  server.stderr.on('data', (chunk) => process.stderr.write(chunk));

  try {
    await waitForServer();

    const health = await fetch(baseUrl);
    if (health.status !== 200) {
      throw new Error(`Expected 200 from root, got ${health.status}`);
    }

    const profile = 'testuser';
    const saveResponse = await fetch(`${baseUrl}/api/profile/${encodeURIComponent(profile)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripName: 'Test viaje', expenses: [{ id: '1', description: 'Taxi', amount: 100, category: 'transporte', currency: 'USD', date: '2026-06-22', createdAt: Date.now() }] }),
    });
    if (saveResponse.status !== 200) {
      throw new Error(`Expected 200 from POST profile, got ${saveResponse.status}`);
    }

    const saved = await saveResponse.json();
    if (saved.profile !== profile) {
      throw new Error('Saved profile does not match');
    }
    if (!Array.isArray(saved.expenses) || saved.expenses.length !== 1) {
      throw new Error('Saved expenses were not returned correctly');
    }

    const loadResponse = await fetch(`${baseUrl}/api/profile/${encodeURIComponent(profile)}`);
    if (loadResponse.status !== 200) {
      throw new Error(`Expected 200 from GET profile, got ${loadResponse.status}`);
    }
    const loaded = await loadResponse.json();
    if (loaded.profile !== profile) {
      throw new Error('Loaded profile does not match');
    }
    if (loaded.tripName !== 'Test viaje') {
      throw new Error('Loaded tripName does not match');
    }
    if (!Array.isArray(loaded.expenses) || loaded.expenses.length !== 1) {
      throw new Error('Loaded expenses were not returned correctly');
    }

    console.log('All tests passed');
  } finally {
    server.kill('SIGTERM');
    if (fs.existsSync(dbFile)) {
      try {
        fs.unlinkSync(dbFile);
      } catch (err) {
        // ignore cleanup failures
      }
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
