import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'dev.db');
const db = new Database(dbPath);

console.log('正在初始化测试数据...');

// 确保表结构存在
db.exec(`
  CREATE TABLE IF NOT EXISTS system_config (key TEXT PRIMARY KEY, value TEXT);
  CREATE TABLE IF NOT EXISTS admins (id TEXT PRIMARY KEY, phone TEXT UNIQUE, password_hash TEXT, role TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS parents (id TEXT PRIMARY KEY, phone TEXT UNIQUE, status TEXT DEFAULT 'NORMAL', last_account_id TEXT, last_assigned_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS account_pool (id TEXT PRIMARY KEY, username TEXT, password TEXT, status TEXT DEFAULT 'VALID', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS cycle_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, start_time DATETIME DEFAULT CURRENT_TIMESTAMP, end_time DATETIME, duration INTEGER);
  
  INSERT OR IGNORE INTO admins (id, phone, password_hash, role) VALUES ('admin_super', '17888837833', '230101', 'SUPER_ADMIN');
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

const insertAcc = db.prepare('INSERT INTO account_pool (id, username, password) VALUES (?, ?, ?)');
accounts.forEach((acc, i) => {
    insertAcc.run(`acc_init_${i}`, acc[0], acc[1]);
});

// 2. 初始化家长白名单
db.prepare('DELETE FROM parents').run();
const parents = [
    ['p_001', '13800138000'],
    ['p_002', '18888888888']
];

const insertParent = db.prepare('INSERT INTO parents (id, phone, status) VALUES (?, ?, ?)');
parents.forEach(p => {
    insertParent.run(p[0], p[1], 'NORMAL');
});

// 3. 初始指针 (修复制导引号问题)
db.prepare("UPDATE system_config SET value = '0' WHERE key = 'global_pointer'").run();

// 4. 重置循环记录
db.prepare('DELETE FROM cycle_logs').run();
db.prepare('INSERT INTO cycle_logs (start_time) VALUES (?)').run(new Date().toISOString());

console.log('✅ 测试数据初始化完成！');
console.log('---');
console.log('已添加 5 个账号，2 个白名单手机号: 13800138000, 18888888888');
console.log('现在您可以运行 npm run dev 并通过这些手机号测试家长端了。');
