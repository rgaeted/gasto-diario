const path = require('path');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data.db');
const usePostgres = Boolean(process.env.DATABASE_URL);
let db;
let sqliteDb;

function initSqlite() {
  return new Promise((resolve, reject) => {
    sqliteDb = new sqlite3.Database(DB_FILE, (err) => {
      if (err) {
        return reject(err);
      }
      sqliteDb.serialize(() => {
        sqliteDb.run('CREATE TABLE IF NOT EXISTS profiles (profile TEXT PRIMARY KEY, tripName TEXT, data TEXT)');
        sqliteDb.run('CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, salt TEXT, hash TEXT, createdAt INTEGER)');
        resolve();
      });
    });
  });
}

async function initPostgres() {
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await db.query('CREATE TABLE IF NOT EXISTS profiles (profile TEXT PRIMARY KEY, tripName TEXT, data TEXT)');
  await db.query('CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, salt TEXT, hash TEXT, createdAt BIGINT)');
}

async function initDb() {
  if (usePostgres) {
    await initPostgres();
  } else {
    await initSqlite();
  }
}

function dbGet(sql, params) {
  if (usePostgres) {
    return db.query(sql, params).then((result) => result.rows[0] || null);
  }
  return new Promise((resolve, reject) => {
    sqliteDb.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function dbRun(sql, params) {
  if (usePostgres) {
    return db.query(sql, params);
  }
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

initDb().catch((err) => {
  console.error('No se pudo inicializar la base de datos', err);
  process.exit(1);
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

function normalizeUser(raw) {
  return (raw || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function genSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
}

app.post('/api/register', async (req, res) => {
  const username = normalizeUser(req.body.username);
  const password = req.body.password;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }
  try {
    const row = await dbGet('SELECT username FROM users WHERE username = $1', [username]);
    if (row) {
      return res.status(409).json({ error: 'El nombre de usuario ya existe' });
    }
    const salt = genSalt();
    const hash = hashPassword(password, salt);
    const createdAt = Date.now();
    await dbRun(
      'INSERT INTO users (username, salt, hash, createdAt) VALUES ($1, $2, $3, $4)',
      [username, salt, hash, createdAt]
    );
    res.status(201).json({ username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error de base de datos' });
  }
});

app.post('/api/login', async (req, res) => {
  const username = normalizeUser(req.body.username);
  const password = req.body.password;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }
  try {
    const row = await dbGet('SELECT salt, hash FROM users WHERE username = $1', [username]);
    if (!row) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    const hash = hashPassword(password, row.salt);
    if (hash !== row.hash) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    res.json({ username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error de base de datos' });
  }
});

app.get('/api/profile/:profile', async (req, res) => {
  const profile = normalizeUser(req.params.profile);
  try {
    const row = await dbGet('SELECT tripName, data FROM profiles WHERE profile = $1', [profile]);
    if (!row) {
      return res.status(404).json({ profile, tripName: 'Mi viaje', expenses: [] });
    }
    let expenses = [];
    try {
      expenses = JSON.parse(row.data || '[]');
    } catch (e) {
      expenses = [];
    }
    res.json({ profile, tripName: row.tripName || 'Mi viaje', expenses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error de base de datos' });
  }
});

app.post('/api/profile/:profile', async (req, res) => {
  const profile = normalizeUser(req.params.profile);
  const tripName = (req.body.tripName || 'Mi viaje').toString();
  const expenses = Array.isArray(req.body.expenses) ? req.body.expenses : [];
  const data = JSON.stringify(expenses);
  const query = `INSERT INTO profiles (profile, tripName, data)
    VALUES ($1, $2, $3)
    ON CONFLICT(profile) DO UPDATE SET tripName = excluded.tripName, data = excluded.data`;
  try {
    await dbRun(query, [profile, tripName, data]);
    res.json({ profile, tripName, expenses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error de base de datos' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
