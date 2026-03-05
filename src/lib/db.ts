import Database from 'better-sqlite3';
import mysql from 'mysql2/promise';
import path from 'path';

const DB_TYPE = process.env.DB_TYPE || 'sqlite';

let sqliteDb: any;
let mysqlPool: any;

if (DB_TYPE === 'mysql') {
  mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: Number(process.env.MYSQL_PORT) || 3306,
  });
} else {
  const dbPath = path.resolve(process.cwd(), 'dev.db');
  sqliteDb = new Database(dbPath);
  sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS system_config (key TEXT PRIMARY KEY, value TEXT);
      CREATE TABLE IF NOT EXISTS admins (id TEXT PRIMARY KEY, phone TEXT UNIQUE, password_hash TEXT, role TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS parents (id TEXT PRIMARY KEY, phone TEXT UNIQUE, status TEXT DEFAULT 'NORMAL', last_account_id TEXT, last_assigned_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS account_pool (id TEXT PRIMARY KEY, username TEXT, password TEXT, status TEXT DEFAULT 'VALID', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS cycle_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, start_time DATETIME DEFAULT CURRENT_TIMESTAMP, end_time DATETIME, duration INTEGER);
      CREATE TABLE IF NOT EXISTS verification_codes (phone TEXT PRIMARY KEY, code TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      INSERT OR IGNORE INTO admins (id, phone, password_hash, role) VALUES ('admin_super', '17888837833', '230101', 'SUPER_ADMIN');
      INSERT OR IGNORE INTO system_config (key, value) VALUES ('global_pointer', '0');
    `);
}

const db = {
  async query(sql: string, params: any[] = []) {
    if (DB_TYPE === 'mysql') {
      const [rows] = await mysqlPool.execute(sql, params);
      return rows;
    }
    return sqliteDb.prepare(sql).all(...params);
  },
  async get(sql: string, params: any[] = []) {
    if (DB_TYPE === 'mysql') {
      const [rows] = await mysqlPool.execute(sql, params);
      return (rows as any[])[0];
    }
    return sqliteDb.prepare(sql).get(...params);
  },
  async run(sql: string, params: any[] = []) {
    if (DB_TYPE === 'mysql') {
      return await mysqlPool.execute(sql, params);
    }
    return sqliteDb.prepare(sql).run(...params);
  },
  prepare(sql: string) {
    return {
      all: (...params: any[]) => this.query(sql, params),
      get: (...params: any[]) => this.get(sql, params),
      run: (...params: any[]) => this.run(sql, params),
    };
  },
  transaction(fn: Function) {
    if (DB_TYPE === 'mysql') {
      return async (...args: any[]) => {
        const connection = await mysqlPool.getConnection();
        await connection.beginTransaction();
        try {
          const res = await fn(connection, ...args);
          await connection.commit();
          return res;
        } catch (e) {
          await connection.rollback();
          throw e;
        } finally {
          connection.release();
        }
      };
    }
    return sqliteDb.transaction(fn);
  }
};

export default db;
