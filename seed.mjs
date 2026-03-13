import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve(process.cwd(), 'dev.db');
const db = new Database(dbPath);
const now = new Date().toISOString();
const demoPassword = 'test1234';
const demoPasswordHash = bcrypt.hashSync(demoPassword, 10);
const adminPassword = '230101';
const adminPasswordHash = bcrypt.hashSync(adminPassword, 10);

console.log('正在初始化测试数据...');

// 确保表结构存在并符合“手机号+密码+图形验证码”登录模式
// 为避免旧表结构缺列，先全量重建相关表
db.exec(`
  DROP TABLE IF EXISTS cycle_logs;
  DROP TABLE IF EXISTS account_pool;
  DROP TABLE IF EXISTS parents;
  DROP TABLE IF EXISTS admins;
  DROP TABLE IF EXISTS system_config;

  CREATE TABLE system_config (key TEXT PRIMARY KEY, value TEXT);
  CREATE TABLE admins (id TEXT PRIMARY KEY, phone TEXT UNIQUE, password_hash TEXT, role TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE parents (id TEXT PRIMARY KEY, phone TEXT UNIQUE, password_hash TEXT, status TEXT DEFAULT 'PENDING', last_account_id TEXT, last_assigned_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE account_pool (id TEXT PRIMARY KEY, username TEXT, password TEXT, status TEXT DEFAULT 'VALID', last_sent_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE cycle_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, start_time DATETIME DEFAULT CURRENT_TIMESTAMP, end_time DATETIME, duration INTEGER);
  
  INSERT OR IGNORE INTO admins (id, phone, password_hash, role) VALUES ('admin_super', '17888837833', '${adminPasswordHash}', 'SUPER_ADMIN');
  INSERT OR IGNORE INTO system_config (key, value) VALUES ('global_pointer', '0');
`);

// 1. 初始化账号池
db.prepare('DELETE FROM account_pool').run();
const accounts = [
    ['study_user_001', 'pwd123456'],
    ['study_user_002', 'abc789000'],
    ['study_user_003', 'test888888'],
    ['study_user_004', 'vip999999'],
    ['study_user_005', 'study2024']
];

const insertAcc = db.prepare('INSERT INTO account_pool (id, username, password, status, last_sent_at, created_at) VALUES (?, ?, ?, ?, ?, ?)');
accounts.forEach((acc, i) => {
    insertAcc.run(`acc_init_${i}`, acc[0], acc[1], 'VALID', null, now);
});

// 2. 初始化家长账号（已开通）
db.prepare('DELETE FROM parents').run();
const parents = [
    ['p_001', '13800138000'],
    ['p_002', '18888888888']
];

const insertParent = db.prepare('INSERT INTO parents (id, phone, password_hash, status, created_at) VALUES (?, ?, ?, ?, ?)');
parents.forEach(p => {
    insertParent.run(p[0], p[1], demoPasswordHash, 'ACTIVE', now);
});

// 3. 初始指针与循环记录
db.prepare("UPDATE system_config SET value = '0' WHERE key = 'global_pointer'").run();
db.prepare('DELETE FROM cycle_logs').run();
db.prepare('INSERT INTO cycle_logs (start_time) VALUES (?)').run(now);

console.log('✅ 测试数据初始化完成！');
console.log('---');
console.log('已添加 5 个账号，2 个示例家长手机号: 13800138000, 18888888888');
console.log(`示例登录密码: ${demoPassword}`);
console.log('超管手机号: 17888837833');
console.log(`超管登录密码: ${adminPassword}`);
console.log('现在您可以运行 npm run dev 并通过上述账号密码测试家长端和超管登录。');
