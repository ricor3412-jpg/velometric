import Database from 'better-sqlite3';
import path from 'path';

// Define DB path (we'll store it in the project root as data.db)
const dbPath = path.join(process.cwd(), 'data.db');
const db = new Database(dbPath, { verbose: console.log });

// Initialize database tables
const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_id INTEGER NOT NULL,
      status TEXT DEFAULT 'running',
      network_profile TEXT DEFAULT '4g',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (domain_id) REFERENCES domains(id)
    );

    CREATE TABLE IF NOT EXISTS scan_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      perf_score INTEGER,
      seo_score INTEGER,
      a11y_score INTEGER,
      bp_score INTEGER,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scan_id) REFERENCES scans(id)
    );

    CREATE TABLE IF NOT EXISTS scan_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scan_id) REFERENCES scans(id)
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Safe migrations for existing DBs
  try { db.exec(`ALTER TABLE scan_results ADD COLUMN device_type TEXT DEFAULT 'desktop';`); } catch (e) {}
  try { db.exec(`ALTER TABLE scans ADD COLUMN network_profile TEXT DEFAULT '4g';`); } catch (e) {}
};

initDb();

export const getOrCreateDomain = (name, url) => {
  const selectStmt = db.prepare('SELECT * FROM domains WHERE name = ?');
  let domain = selectStmt.get(name);
  if (!domain) {
    const insertStmt = db.prepare('INSERT INTO domains (name, url) VALUES (?, ?)');
    const info = insertStmt.run(name, url);
    domain = selectStmt.get(name); // fetch newly created
  }
  return domain;
};

export const startScan = (domainId, networkProfile = '4g') => {
  const insertStmt = db.prepare('INSERT INTO scans (domain_id, status, network_profile) VALUES (?, ?, ?)');
  const info = insertStmt.run(domainId, 'running', networkProfile);
  return info.lastInsertRowid;
};

export const finishScan = (scanId) => {
  const updateStmt = db.prepare("UPDATE scans SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?");
  updateStmt.run(scanId);
};

export const savePageResult = (scanId, url, deviceType, scores, rawData = '{}') => {
  const insertStmt = db.prepare(`
    INSERT INTO scan_results (scan_id, url, device_type, perf_score, seo_score, a11y_score, bp_score, raw_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertStmt.run(scanId, url, deviceType, scores.performance, scores.seo, scores.accessibility, scores['best-practices'], rawData);
};

export const appendLog = (scanId, message, type = 'info') => {
  const insertStmt = db.prepare('INSERT INTO scan_logs (scan_id, message, type) VALUES (?, ?, ?)');
  insertStmt.run(scanId, message, type);
};

export const getLatestScans = () => {
  const stmt = db.prepare(`
    SELECT domains.name, domains.url, scans.id as scan_id, scans.status, scans.network_profile, scans.started_at 
    FROM domains
    JOIN scans ON domains.id = scans.domain_id
    ORDER BY scans.started_at DESC
    LIMIT 20
  `);
  return stmt.all();
};

export const getDomainScans = (domainName) => {
  const stmt = db.prepare(`
    SELECT scans.id, scans.status, scans.network_profile, scans.started_at, scans.completed_at
    FROM scans
    JOIN domains ON scans.domain_id = domains.id
    WHERE domains.name = ?
    ORDER BY scans.started_at DESC
  `);
  return stmt.all(domainName);
};

export const getScanById = (id) => {
  const stmt = db.prepare(`
    SELECT scans.*, domains.name as domain_name, domains.url as domain_url
    FROM scans 
    JOIN domains ON scans.domain_id = domains.id
    WHERE scans.id = ?
  `);
  return stmt.get(id);
};

export const getScanResults = (scanId) => {
  const stmt = db.prepare(`
    SELECT * FROM scan_results WHERE scan_id = ?
  `);
  return stmt.all(scanId);
};

export const getScanLogs = (scan_id) => {
  const stmt = db.prepare('SELECT * FROM scan_logs WHERE scan_id = ? ORDER BY created_at ASC');
  return stmt.all(scan_id);
};

// --- API KEY MANAGEMENT ---

export const createApiKey = (name) => {
  const key = 'ps_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const stmt = db.prepare('INSERT INTO api_keys (key, name) VALUES (?, ?)');
  stmt.run(key, name);
  return key;
};

export const validateApiKey = (key) => {
  const stmt = db.prepare('SELECT * FROM api_keys WHERE key = ?');
  const result = stmt.get(key);
  return !!result;
};

export const listApiKeys = () => {
  return db.prepare('SELECT id, name, created_at FROM api_keys ORDER BY created_at DESC').all();
};

export const revokeApiKey = (id) => {
  db.prepare('DELETE FROM api_keys WHERE id = ?').run(id);
};

export default db;
