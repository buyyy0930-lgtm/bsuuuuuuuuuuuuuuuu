const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

// Database faylı data qovluğunda saxlanılacaq
const dbPath = path.join(__dirname, 'data', 'bsu_chat.db');
const db = new Database(dbPath);

// WAL mode for better performance
db.pragma('journal_mode = WAL');

// Tabloları yarat
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fullname TEXT NOT NULL,
    faculty TEXT NOT NULL,
    degree TEXT NOT NULL,
    course INTEGER NOT NULL,
    avatar TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admins (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS blocked_users (
    user_id TEXT NOT NULL,
    blocked_user_id TEXT NOT NULL,
    PRIMARY KEY (user_id, blocked_user_id)
  );

  CREATE TABLE IF NOT EXISTS user_reports (
    user_id TEXT PRIMARY KEY,
    report_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
  CREATE INDEX IF NOT EXISTS idx_blocked_users ON blocked_users(user_id);
`);

// Default settings
const defaultSettings = {
  rules: 'BSU Chat qaydalarına xoş gəlmisiniz!',
  dailyTopic: 'Bugün fakültənizlə bağlı fikirlərini paylaş!',
  bannedWords: 'spam,reklam',
  groupExpiryMinutes: '1440',
  groupExpiryUnit: 'hours',
  privateExpiryMinutes: '2880',
  privateExpiryUnit: 'hours'
};

// Settings-ləri initialize et
const initSettings = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
for (const [key, value] of Object.entries(defaultSettings)) {
  initSettings.run(key, value);
}

// Super admin əlavə et
const checkAdmin = db.prepare('SELECT * FROM admins WHERE username = ?').get('ursamajor');
if (!checkAdmin) {
  const hashedPassword = bcrypt.hashSync('ursa618', 10);
  db.prepare('INSERT INTO admins (username, password, role) VALUES (?, ?, ?)').run('ursamajor', hashedPassword, 'super');
}

// Database helper functions
const dbHelpers = {
  // Users
  createUser: db.prepare(`
    INSERT INTO users (id, phone, email, password, fullname, faculty, degree, course, avatar, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  
  getUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  getUserByPhone: db.prepare('SELECT * FROM users WHERE phone = ?'),
  getUserById: db.prepare('SELECT * FROM users WHERE id = ?'),
  getAllUsers: db.prepare('SELECT * FROM users ORDER BY created_at DESC'),
  updateUserStatus: db.prepare('UPDATE users SET status = ? WHERE id = ?'),
  updateUserProfile: db.prepare('UPDATE users SET fullname = ?, faculty = ?, degree = ?, course = ? WHERE id = ?'),
  updateUserAvatar: db.prepare('UPDATE users SET avatar = ? WHERE id = ?'),
  
  // Admins
  getAdminByUsername: db.prepare('SELECT * FROM admins WHERE username = ?'),
  getAllAdmins: db.prepare('SELECT username, role FROM admins'),
  createAdmin: db.prepare('INSERT INTO admins (username, password, role) VALUES (?, ?, ?)'),
  deleteAdmin: db.prepare('DELETE FROM admins WHERE username = ?'),
  
  // Blocked users
  blockUser: db.prepare('INSERT OR IGNORE INTO blocked_users (user_id, blocked_user_id) VALUES (?, ?)'),
  getBlockedUsers: db.prepare('SELECT blocked_user_id FROM blocked_users WHERE user_id = ?'),
  
  // Reports
  getReportCount: db.prepare('SELECT report_count FROM user_reports WHERE user_id = ?'),
  incrementReport: db.prepare(`
    INSERT INTO user_reports (user_id, report_count) VALUES (?, 1)
    ON CONFLICT(user_id) DO UPDATE SET report_count = report_count + 1
  `),
  getAllReports: db.prepare('SELECT * FROM user_reports'),
  
  // Settings
  getSetting: db.prepare('SELECT value FROM settings WHERE key = ?'),
  setSetting: db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)'),
  getAllSettings: db.prepare('SELECT * FROM settings')
};

const dbAPI = {
  // User methods
  getAllUsers: () => dbHelpers.getAllUsers.all(),
  getUserById: (id) => dbHelpers.getUserById.get(id),
  getUserByEmail: (email) => dbHelpers.getUserByEmail.get(email),
  getUserByPhone: (phone) => dbHelpers.getUserByPhone.get(phone),
  createUser: (userData) => dbHelpers.createUser.run(...userData),
  updateUserStatus: (status, id) => dbHelpers.updateUserStatus.run(status, id),
  updateUserProfile: (fullname, faculty, degree, course, id) => dbHelpers.updateUserProfile.run(fullname, faculty, degree, course, id),
  updateUserAvatar: (avatar, id) => dbHelpers.updateUserAvatar.run(avatar, id),
  
  // Admin methods
  getAdminByUsername: (username) => dbHelpers.getAdminByUsername.get(username),
  getAllAdmins: () => dbHelpers.getAllAdmins.all(),
  createAdmin: (username, password, role) => dbHelpers.createAdmin.run(username, password, role),
  deleteAdmin: (username) => dbHelpers.deleteAdmin.run(username),
  
  // Block methods
  blockUser: (userId, blockedUserId) => dbHelpers.blockUser.run(userId, blockedUserId),
  getBlockedUsers: (userId) => {
    const rows = dbHelpers.getBlockedUsers.all(userId);
    return rows.map(r => r.blocked_user_id);
  },
  isBlocked: (userId, targetUserId) => {
    const blocked = dbHelpers.getBlockedUsers.all(userId);
    return blocked.some(r => r.blocked_user_id === targetUserId);
  },
  
  // Report methods
  getReportCount: (userId) => {
    const result = dbHelpers.getReportCount.get(userId);
    return result ? result.report_count : 0;
  },
  incrementReport: (userId) => dbHelpers.incrementReport.run(userId),
  getAllReports: () => dbHelpers.getAllReports.all(),
  
  // Settings methods
  getRules: () => {
    const result = dbHelpers.getSetting.get('rules');
    return result ? result.value : 'Saytda ədəb qaydalarına riayət edin.';
  },
  setRules: (rules) => dbHelpers.setSetting.run('rules', rules),
  
  getDailyTopic: () => {
    const result = dbHelpers.getSetting.get('dailyTopic');
    return result ? result.value : 'Günün mövzusu yoxdur';
  },
  setDailyTopic: (topic) => dbHelpers.setSetting.run('dailyTopic', topic),
  
  getBannedWords: () => {
    const result = dbHelpers.getSetting.get('bannedWords');
    return result ? JSON.parse(result.value) : [];
  },
  setBannedWords: (words) => dbHelpers.setSetting.run('bannedWords', JSON.stringify(words)),
  
  getMessageExpiry: () => {
    const result = dbHelpers.getSetting.get('messageExpiry');
    return result ? JSON.parse(result.value) : {
      groupMinutes: 1440,
      groupUnit: 'hours',
      groupHours: 24,
      privateMinutes: 2880,
      privateUnit: 'hours',
      privateHours: 48
    };
  },
  setMessageExpiry: (expiry) => dbHelpers.setSetting.run('messageExpiry', JSON.stringify(expiry))
};

module.exports = { db, dbHelpers, dbAPI };
