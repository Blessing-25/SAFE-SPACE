import Database from 'better-sqlite3';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const isConfigured = (val?: string) => val && val.trim() !== '' && !val.startsWith('MY_') && !val.startsWith('TODO');
let useMySQL = !!(
  isConfigured(process.env.MYSQL_HOST) && 
  isConfigured(process.env.MYSQL_USER) && 
  isConfigured(process.env.MYSQL_DATABASE)
);
let sqliteDb = new Database('safespace.db');
let mysqlPool: mysql.Pool | null = null;

if (useMySQL) {
  mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: Number(process.env.MYSQL_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 2000,
  });
}

export const db = {
  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (useMySQL && mysqlPool) {
      try {
        const [rows] = await mysqlPool.execute(sql, params);
        return rows as any[];
      } catch (err: any) {
        if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
          console.error(`MySQL connection failed (${err.code}), falling back to SQLite.`);
          useMySQL = false;
          return this.query(sql, params);
        }
        throw err;
      }
    }
    return sqliteDb.prepare(sql).all(...params);
  },

  async get(sql: string, params: any[] = []): Promise<any> {
    if (useMySQL && mysqlPool) {
      try {
        const [rows] = await mysqlPool.execute(sql, params);
        return (rows as any[])[0];
      } catch (err: any) {
        if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
          console.error(`MySQL connection failed (${err.code}), falling back to SQLite.`);
          useMySQL = false;
          return this.get(sql, params);
        }
        throw err;
      }
    }
    return sqliteDb.prepare(sql).get(...params);
  },

  async run(sql: string, params: any[] = []): Promise<{ lastInsertRowid: number | string }> {
    if (useMySQL && mysqlPool) {
      try {
        const [result] = await mysqlPool.execute(sql, params);
        const res = result as any;
        return { lastInsertRowid: res.insertId };
      } catch (err: any) {
        if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
          console.error(`MySQL connection failed (${err.code}), falling back to SQLite.`);
          useMySQL = false;
          return this.run(sql, params);
        }
        throw err;
      }
    }
    const result = sqliteDb.prepare(sql).run(...params);
    return { lastInsertRowid: result.lastInsertRowid };
  },

  async exec(sql: string): Promise<void> {
    if (useMySQL && mysqlPool) {
      try {
        const statements = sql.split(';').filter(s => s.trim());
        for (const s of statements) {
          await mysqlPool.execute(s);
        }
        return;
      } catch (err: any) {
        if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
          console.error(`MySQL connection failed (${err.code}), falling back to SQLite.`);
          useMySQL = false;
          return this.exec(sql);
        }
        throw err;
      }
    }
    sqliteDb.exec(sql);
  },
  
  isMySQL() {
    return useMySQL;
  },

  async testConnection() {
    if (useMySQL && mysqlPool) {
      try {
        const conn = await mysqlPool.getConnection();
        conn.release();
        return true;
      } catch (err: any) {
        // Only log if it's a real configuration but the server is down
        if (err.code !== 'ECONNREFUSED' || process.env.MYSQL_HOST !== '127.0.0.1') {
          console.warn(`MySQL connection test failed: ${err.message}. Falling back to SQLite.`);
        }
        useMySQL = false;
        return false;
      }
    }
    return false;
  }
};

function getInitSql() {
  const mysqlFlavor = db.isMySQL();
  return `
  CREATE TABLE IF NOT EXISTS users (
    id ${mysqlFlavor ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255),
    anonymous_alias VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student',
    status VARCHAR(50) DEFAULT 'active',
    user_status VARCHAR(100) DEFAULT 'normal',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ai_alerts (
    id ${mysqlFlavor ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
    user_id INT NOT NULL,
    alert_level VARCHAR(50) NOT NULL,
    trigger_phrase TEXT,
    source VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ai_notifications (
    id ${mysqlFlavor ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(100) NOT NULL,
    is_read ${mysqlFlavor ? 'BOOLEAN DEFAULT FALSE' : 'INTEGER DEFAULT 0'},
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ai_activity (
    id ${mysqlFlavor ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
    user_id INT NOT NULL,
    analysis_type VARCHAR(100) NOT NULL,
    result VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS mood_logs (
    id ${mysqlFlavor ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
    user_id INT NOT NULL,
    emoji VARCHAR(50) NOT NULL,
    reflection TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id ${mysqlFlavor ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id ${mysqlFlavor ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
    room_id INT NOT NULL,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    is_reported ${mysqlFlavor ? 'BOOLEAN DEFAULT FALSE' : 'INTEGER DEFAULT 0'},
    report_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS wellness_goals (
    id ${mysqlFlavor ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
    user_id INT NOT NULL,
    goal_type VARCHAR(255) NOT NULL,
    is_completed ${mysqlFlavor ? 'BOOLEAN DEFAULT FALSE' : 'INTEGER DEFAULT 0'},
    date VARCHAR(20) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS counselors (
    id ${mysqlFlavor ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
    user_id INT,
    name VARCHAR(255) NOT NULL,
    specialties TEXT NOT NULL,
    bio TEXT,
    photo_url TEXT,
    phone_number VARCHAR(50),
    is_available ${mysqlFlavor ? 'BOOLEAN DEFAULT FALSE' : 'INTEGER DEFAULT 0'},
    status VARCHAR(50) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id ${mysqlFlavor ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
    student_id INT NOT NULL,
    counselor_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    method VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    reminder_1h_sent ${mysqlFlavor ? 'BOOLEAN DEFAULT FALSE' : 'INTEGER DEFAULT 0'},
    reminder_15m_sent ${mysqlFlavor ? 'BOOLEAN DEFAULT FALSE' : 'INTEGER DEFAULT 0'},
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS session_notes (
    id ${mysqlFlavor ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
    counselor_id INT NOT NULL,
    student_id INT NOT NULL,
    notes TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reports (
    id ${mysqlFlavor ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
    message_id INT NOT NULL,
    reported_by INT NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS system_logs (
    id ${mysqlFlavor ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
    event_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS crisis_resources (
    id ${mysqlFlavor ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
    title VARCHAR(255) NOT NULL,
    description TEXT,
    contact VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS message_reactions (
    id ${mysqlFlavor ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
    message_id INT NOT NULL,
    user_id INT NOT NULL,
    reaction_type VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, reaction_type)
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    id ${mysqlFlavor ? 'INT AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;
}

async function initialize() {
  await db.testConnection();
  await db.exec(getInitSql());

  // Migration: Ensure system_settings has default values
  const settingsCount = await db.query('SELECT COUNT(*) as count FROM system_settings');
  if ((settingsCount[0] as any).count === 0) {
    await db.run('INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)', ['mpesa_number', '+254 700 000 000']);
    await db.run('INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)', ['account_number', '1234567890']);
    await db.run('INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)', ['paypal_email', 'support@safespace.com']);
  }

  // Migration: Ensure full_name column exists in users table (SQLite specific check)
  if (!useMySQL) {
    try {
      const tableInfo = sqliteDb.prepare("PRAGMA table_info(users)").all();
      const hasFullName = tableInfo.some((col: any) => col.name === 'full_name');
      if (!hasFullName) {
        console.log('Adding full_name column to users table...');
        sqliteDb.prepare("ALTER TABLE users ADD COLUMN full_name VARCHAR(255)").run();
      }
    } catch (err) {
      console.error('Migration error (full_name):', err);
    }

    try {
      const roomInfo = sqliteDb.prepare("PRAGMA table_info(rooms)").all();
      const hasStatus = roomInfo.some((col: any) => col.name === 'status');
      const hasCreatedBy = roomInfo.some((col: any) => col.name === 'created_by');
      const hasCreatedAt = roomInfo.some((col: any) => col.name === 'created_at');

      if (!hasStatus) {
        console.log('Adding status column to rooms table...');
        sqliteDb.prepare("ALTER TABLE rooms ADD COLUMN status VARCHAR(50) DEFAULT 'active'").run();
      }
      if (!hasCreatedBy) {
        console.log('Adding created_by column to rooms table...');
        sqliteDb.prepare("ALTER TABLE rooms ADD COLUMN created_by INT").run();
      }
      if (!hasCreatedAt) {
        console.log('Adding created_at column to rooms table...');
        sqliteDb.prepare("ALTER TABLE rooms ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP").run();
      }

      // Backfill any NULL values
      sqliteDb.prepare("UPDATE rooms SET status = 'active' WHERE status IS NULL").run();
      sqliteDb.prepare("UPDATE rooms SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL").run();
    } catch (err) {
      console.error('Migration error (rooms columns):', err);
    }

    try {
      const usersInfo = sqliteDb.prepare("PRAGMA table_info(users)").all();
      const hasUserStatus = usersInfo.some((col: any) => col.name === 'user_status');
      if (!hasUserStatus) {
        console.log('Adding user_status column to users table...');
        sqliteDb.prepare("ALTER TABLE users ADD COLUMN user_status VARCHAR(100) DEFAULT 'normal'").run();
      }
    } catch (err) {
      console.error('Migration error (user_status):', err);
    }

    try {
      const counselorInfo = sqliteDb.prepare("PRAGMA table_info(counselors)").all();
      const hasPhoneNumber = counselorInfo.some((col: any) => col.name === 'phone_number');
      const hasIsAvailable = counselorInfo.some((col: any) => col.name === 'is_available');
      const hasCounselorCreatedAt = counselorInfo.some((col: any) => col.name === 'created_at');
      if (!hasPhoneNumber) {
        console.log('Adding phone_number column to counselors table...');
        sqliteDb.prepare("ALTER TABLE counselors ADD COLUMN phone_number VARCHAR(50)").run();
      }
      if (!hasIsAvailable) {
        console.log('Adding is_available column to counselors table...');
        sqliteDb.prepare("ALTER TABLE counselors ADD COLUMN is_available INTEGER DEFAULT 0").run();
      }
      if (!hasCounselorCreatedAt) {
        console.log('Adding created_at column to counselors table...');
        sqliteDb.prepare("ALTER TABLE counselors ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP").run();
      }
      // Backfill NULL created_at values so ORDER BY works correctly
      sqliteDb.prepare("UPDATE counselors SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL").run();
    } catch (err) {
      console.error('Migration error (counselors columns):', err);
    }

    try {
      const appointmentInfo = sqliteDb.prepare("PRAGMA table_info(appointments)").all();
      const has1hReminder = appointmentInfo.some((col: any) => col.name === 'reminder_1h_sent');
      if (!has1hReminder) {
        console.log('Adding reminder columns to appointments table...');
        sqliteDb.prepare("ALTER TABLE appointments ADD COLUMN reminder_1h_sent INTEGER DEFAULT 0").run();
        sqliteDb.prepare("ALTER TABLE appointments ADD COLUMN reminder_15m_sent INTEGER DEFAULT 0").run();
      }
    } catch (err) {
      console.error('Migration error (appointments reminder columns):', err);
    }
  }
  
  const rooms = await db.query('SELECT COUNT(*) as count FROM rooms');
  const count = (rooms[0] as any).count;
  
  if (count === 0) {
    await db.run('INSERT INTO rooms (name, description) VALUES (?, ?)', ['Academic Stress', 'Discuss exams, assignments, and study pressure.']);
    await db.run('INSERT INTO rooms (name, description) VALUES (?, ?)', ['Relationships', 'Share feelings about friendships and romantic life.']);
    await db.run('INSERT INTO rooms (name, description) VALUES (?, ?)', ['Family Pressure', 'A safe space for family-related challenges.']);
    await db.run('INSERT INTO rooms (name, description) VALUES (?, ?)', ['General Support', 'Open discussion for anything on your mind.']);
  }

  const crisisCount = await db.query('SELECT COUNT(*) as count FROM crisis_resources');
  if ((crisisCount[0] as any).count === 0) {
    await db.run('INSERT INTO crisis_resources (title, description, contact, category) VALUES (?, ?, ?, ?)', 
      ['Befrienders Kenya', 'Confidential emotional support for people in distress or at risk of suicide.', '+254722178177', 'emergency']);
    await db.run('INSERT INTO crisis_resources (title, description, contact, category) VALUES (?, ?, ?, ?)', 
      ['National Emergency Hotline', 'Immediate assistance for police, fire, or medical emergencies.', '999', 'emergency']);
    await db.run('INSERT INTO crisis_resources (title, description, contact, category) VALUES (?, ?, ?, ?)', 
      ['Kenya Red Cross', 'Emergency medical services and disaster response.', '1199', 'emergency']);
    await db.run('INSERT INTO crisis_resources (title, description, contact, category) VALUES (?, ?, ?, ?)', 
      ['NACADA Helpline', 'Support for alcohol and drug abuse related issues.', '1192', 'support']);
    await db.run('INSERT INTO crisis_resources (title, description, contact, category) VALUES (?, ?, ?, ?)', 
      ['GBV Hotline', 'Gender-Based Violence support and reporting.', '1195', 'support']);
    await db.run('INSERT INTO crisis_resources (title, description, contact, category) VALUES (?, ?, ?, ?)', 
      ['School Help Line', 'Direct line to the university security and wellness office.', '+254711000000', 'campus']);
    await db.run('INSERT INTO crisis_resources (title, description, contact, category) VALUES (?, ?, ?, ?)', 
      ['Campus Counseling', 'Direct line to the university counseling department for urgent support.', '+254700000000', 'campus']);
    await db.run('INSERT INTO crisis_resources (title, description, contact, category) VALUES (?, ?, ?, ?)', 
      ['Crisis Text Line', 'Text HOME to 741741 to connect with a Crisis Counselor.', '741741', 'text']);
  }

  const counselorCount = await db.query('SELECT COUNT(*) as count FROM counselors');
  if ((counselorCount[0] as any).count === 0) {
    // Create user accounts for seed counselors first
    const sarahPass = await bcrypt.hash('password123', 10);
    const davidPass = await bcrypt.hash('password123', 10);
    const adminPass = await bcrypt.hash('admin123', 10);

    const sql = useMySQL 
      ? 'INSERT IGNORE INTO users (username, password_hash, full_name, anonymous_alias, role) VALUES (?, ?, ?, ?, ?)'
      : 'INSERT OR IGNORE INTO users (username, password_hash, full_name, anonymous_alias, role) VALUES (?, ?, ?, ?, ?)';
    
    await db.run(sql, ['admin', adminPass, 'System Admin', 'Admin', 'admin']);

    // Seed Counselors
    await db.run('INSERT OR IGNORE INTO users (username, password_hash, full_name, anonymous_alias, role) VALUES (?, ?, ?, ?, ?)', 
      ['sarah.jenkins', sarahPass, 'Dr. Sarah Jenkins', 'Sarah J.', 'counselor']);
    
    await db.run('INSERT OR IGNORE INTO users (username, password_hash, full_name, anonymous_alias, role) VALUES (?, ?, ?, ?, ?)', 
      ['david.chen', davidPass, 'Mr. David Chen', 'David C.', 'counselor']);

    const sarahUser = await db.get('SELECT id FROM users WHERE username = ?', ['sarah.jenkins']);
    const davidUser = await db.get('SELECT id FROM users WHERE username = ?', ['david.chen']);

    if (sarahUser) {
      await db.run('INSERT OR IGNORE INTO counselors (user_id, name, specialties, bio, photo_url, status) VALUES (?, ?, ?, ?, ?, ?)', [
        sarahUser.id,
        'Dr. Sarah Jenkins', 
        'Anxiety, Exam Stress', 
        'Hi, I\'m Sarah. I\'ve been working with students for 10 years to help navigate academic and personal challenges.',
        'https://picsum.photos/seed/sarah/200/200',
        'active'
      ]);
    }

    if (davidUser) {
      await db.run('INSERT OR IGNORE INTO counselors (user_id, name, specialties, bio, photo_url, status) VALUES (?, ?, ?, ?, ?, ?)', [
        davidUser.id,
        'Mr. David Chen', 
        'Relationships, Family Support', 
        'Specializing in interpersonal dynamics and helping students build healthy boundaries and communication skills.',
        'https://picsum.photos/seed/david/200/200',
        'active'
      ]);
    }
  }
}

initialize().catch(console.error);

export default db;
