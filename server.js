const path = require('path');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data.db');

const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('No se pudo abrir la base de datos', err);
    process.exit(1);
  }
});

db.serialize(() => {
  db.run(
    'CREATE TABLE IF NOT EXISTS profiles (profile TEXT PRIMARY KEY, tripName TEXT, data TEXT)'
  );
  db.run(
    'CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, salt TEXT, hash TEXT, createdAt INTEGER)'
  );
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

app.post('/api/register', (req, res) => {
  const username = normalizeUser(req.body.username);
  const password = req.body.password;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }
  db.get('SELECT username FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error de base de datos' });
    }
    if (row) {
      return res.status(409).json({ error: 'El nombre de usuario ya existe' });
    }
    const salt = genSalt();
    const hash = hashPassword(password, salt);
    const createdAt = Date.now();
    db.run(
      'INSERT INTO users (username, salt, hash, createdAt) VALUES (?, ?, ?, ?)',
      [username, salt, hash, createdAt],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error de base de datos' });
        }
        res.status(201).json({ username });
      }
    );
  });
});

app.post('/api/login', (req, res) => {
  const username = normalizeUser(req.body.username);
  const password = req.body.password;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }
  db.get('SELECT salt, hash FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error de base de datos' });
    }
    if (!row) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    const hash = hashPassword(password, row.salt);
    if (hash !== row.hash) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    res.json({ username });
  });
});

app.get('/api/profile/:profile', (req, res) => {
  const profile = normalizeUser(req.params.profile);
  db.get(
    'SELECT tripName, data FROM profiles WHERE profile = ?',
    [profile],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Error de base de datos' });
      }
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
    }
  );
});

app.post('/api/profile/:profile', (req, res) => {
  const profile = normalizeUser(req.params.profile);
  const tripName = (req.body.tripName || 'Mi viaje').toString();
  const expenses = Array.isArray(req.body.expenses) ? req.body.expenses : [];
  const data = JSON.stringify(expenses);
  const query = `INSERT INTO profiles (profile, tripName, data)
    VALUES (?, ?, ?)
    ON CONFLICT(profile) DO UPDATE SET tripName = excluded.tripName, data = excluded.data`;
  db.run(query, [profile, tripName, data], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Error de base de datos' });
    }
    res.json({ profile, tripName, expenses });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
