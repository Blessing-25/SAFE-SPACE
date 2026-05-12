import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './src/db';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeMoodHistory, analyzeText, detectCrisis, generateSupportMessage } from './src/ai/mindcare.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'safespace-secret-key';

console.log('SERVER STARTING...');

const userSockets = new Map<number, string[]>();

async function startServer() {
  console.log('startServer() called');
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    }
  });

  app.use(cors());
  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  const authorizeRole = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      next();
    };
  };

  // --- API Routes ---

  app.get('/api/health', async (req, res) => {
    try {
      const testPass = await bcrypt.hash('test', 10);
      const match = await bcrypt.compare('test', testPass);
      const dbTest = await db.get('SELECT 1 as ok');
      const userCount = await db.get('SELECT COUNT(*) as count FROM users');
      res.json({ status: 'ok', bcrypt: match, db: !!dbTest, userCount: userCount.count });
    } catch (e: any) {
      res.status(500).json({ status: 'error', message: e.message });
    }
  });
  app.post('/api/auth/signup', async (req, res) => {
    const { username, password, fullName, alias, role = 'student' } = req.body;
    try {
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await db.run('INSERT INTO users (username, password_hash, full_name, anonymous_alias, role) VALUES (?, ?, ?, ?, ?)', [username, hashedPassword, fullName, alias, role]);
      const userId = result.lastInsertRowid;
      
      if (role === 'counselor') {
        await db.run('INSERT INTO counselors (user_id, name, specialties, bio, status) VALUES (?, ?, ?, ?, ?)', [userId, fullName || username, 'General', 'New Counselor', 'pending']);
        await db.run('INSERT INTO system_logs (event_type, message) VALUES (?, ?)', ['COUNSELOR_SIGNUP', `New counselor application: ${fullName || username}`]);
      } else {
        await db.run('INSERT INTO system_logs (event_type, message) VALUES (?, ?)', ['STUDENT_SIGNUP', `New student registered: ${username}`]);
      }

      const token = jwt.sign({ id: userId, username, fullName, alias, role }, JWT_SECRET);
      res.json({ token, user: { id: userId, username, fullName, alias, role } });
    } catch (e: any) {
      console.error('Signup error:', e);
      if (e.message && e.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      res.status(500).json({ error: 'Internal server error during signup' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      if (user.status === 'suspended') {
        return res.status(403).json({ error: 'Account suspended' });
      }
      const token = jwt.sign({ id: user.id, username: user.username, fullName: user.full_name, alias: user.anonymous_alias, role: user.role }, JWT_SECRET);
      res.json({ token, user: { id: user.id, username: user.username, fullName: user.full_name, alias: user.anonymous_alias, role: user.role } });
    } catch (e) {
      console.error('Login error:', e);
      res.status(500).json({ error: 'Internal server error during login' });
    }
  });

  // Moods
  app.get('/api/moods', authenticateToken, async (req: any, res) => {
    const moods = await db.query('SELECT * FROM mood_logs WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(moods);
  });

  app.post('/api/moods', authenticateToken, async (req: any, res) => {
    const { emoji, reflection } = req.body;
    try {
      await db.run('INSERT INTO mood_logs (user_id, emoji, reflection) VALUES (?, ?, ?)', [req.user.id, emoji, reflection]);
      
      // Basic activity log (Deep analysis now handled by frontend via MindCare AI)
      await db.run('INSERT INTO ai_activity (user_id, analysis_type, result) VALUES (?, ?, ?)', [req.user.id, 'MOOD_LOGGED', 'SUCCESS']);

      // Immediate Detection
      if (reflection) {
        if (detectCrisis(reflection)) {
          const supportMsg = generateSupportMessage("CRITICAL");
          await db.run('INSERT INTO ai_notifications (user_id, message, type) VALUES (?, ?, ?)', [req.user.id, supportMsg, 'CRITICAL_ALERT']);
          await db.run('INSERT INTO ai_alerts (user_id, alert_level, trigger_phrase, source) VALUES (?, ?, ?, ?)', [req.user.id, 'CRITICAL', reflection, 'MOOD_REFLECTION']);
          await db.run('UPDATE users SET user_status = ? WHERE id = ?', ['high_priority_support', req.user.id]);
          await db.run('INSERT INTO system_logs (event_type, message) VALUES (?, ?)', ['CRISIS_DETECTED', `Crisis detected in mood reflection from user #${req.user.id}`]);
          
          const sockets = userSockets.get(req.user.id);
          if (sockets) {
            sockets.forEach(sid => io.to(sid).emit('ai-critical-alert', { message: supportMsg }));
          }
          await notifyStaffOfCrisis(req.user.id, reflection, 'Mood Reflection');
        } else if (analyzeText(reflection) === 'MEDIUM') {
          // Could notify staff for medium too, but prompt specifically asked for critical
          // Just update status maybe?
        }
      }

      res.sendStatus(201);
    } catch (e) {
      console.error('Mood log error:', e);
      res.status(500).json({ error: 'Failed to log mood' });
    }
  });

  // Rooms
  app.get('/api/rooms', authenticateToken, async (req, res) => {
    const rooms = await db.query("SELECT * FROM rooms WHERE status = 'active'");
    res.json(rooms);
  });

  // Rooms — admin can create directly (active), others propose (pending)
  app.post('/api/rooms', authenticateToken, async (req: any, res) => {
    const { name, description } = req.body;
    try {
      if (!name?.trim()) return res.status(400).json({ error: 'Room name is required' });
      const status = req.user.role === 'admin' ? 'active' : 'pending';
      await db.run('INSERT INTO rooms (name, description, status, created_by) VALUES (?, ?, ?, ?)', [name.trim(), description?.trim() || '', status, req.user.id]);
      await db.run('INSERT INTO system_logs (event_type, message) VALUES (?, ?)', [
        req.user.role === 'admin' ? 'ROOM_CREATED' : 'ROOM_PROPOSED',
        req.user.role === 'admin' ? `Admin created room: ${name}` : `New room proposed by ${req.user.username}: ${name}`
      ]);
      res.status(201).json({ status });
    } catch (e) {
      console.error('Room creation error:', e);
      res.status(500).json({ error: 'Failed to create room' });
    }
  });

  app.get('/api/rooms/:id/messages', authenticateToken, async (req: any, res) => {
    const messages = await db.query(`
      SELECT m.*, u.anonymous_alias, u.full_name, u.role,
             (SELECT COUNT(*) FROM message_reactions WHERE message_id = m.id AND reaction_type = 'heart') as heart_count,
             (SELECT COUNT(*) FROM message_reactions WHERE message_id = m.id AND reaction_type = 'hug') as hug_count,
             (SELECT COUNT(*) FROM message_reactions WHERE message_id = m.id AND reaction_type = 'support') as support_count,
             EXISTS(SELECT 1 FROM message_reactions WHERE message_id = m.id AND user_id = ? AND reaction_type = 'heart') as user_has_hearted,
             EXISTS(SELECT 1 FROM message_reactions WHERE message_id = m.id AND user_id = ? AND reaction_type = 'hug') as user_has_hugged,
             EXISTS(SELECT 1 FROM message_reactions WHERE message_id = m.id AND user_id = ? AND reaction_type = 'support') as user_has_supported
      FROM chat_messages m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.room_id = ? 
      ORDER BY m.created_at ASC 
      LIMIT 100
    `, [req.user.id, req.user.id, req.user.id, req.params.id]);

    const formattedMessages = messages.map(m => ({
      ...m,
      author_alias: m.role === 'student' ? m.anonymous_alias : `${m.full_name || 'Staff'} (${m.role.toUpperCase()})`,
      reactions: {
        heart: m.heart_count,
        hug: m.hug_count,
        support: m.support_count
      },
      userReactions: {
        heart: !!m.user_has_hearted,
        hug: !!m.user_has_hugged,
        support: !!m.user_has_supported
      }
    }));

    res.json(formattedMessages);
  });

  app.post('/api/messages/:id/react', authenticateToken, async (req: any, res) => {
    const { reactionType } = req.body;
    const messageId = req.params.id;
    const userId = req.user.id;

    try {
      const existing = await db.get('SELECT id FROM message_reactions WHERE message_id = ? AND user_id = ? AND reaction_type = ?', [messageId, userId, reactionType]);
      
      if (existing) {
        await db.run('DELETE FROM message_reactions WHERE id = ?', [existing.id]);
      } else {
        await db.run('INSERT INTO message_reactions (message_id, user_id, reaction_type) VALUES (?, ?, ?)', [messageId, userId, reactionType]);
      }

      const counts = await db.get(`
        SELECT 
          (SELECT COUNT(*) FROM message_reactions WHERE message_id = ? AND reaction_type = 'heart') as heart,
          (SELECT COUNT(*) FROM message_reactions WHERE message_id = ? AND reaction_type = 'hug') as hug,
          (SELECT COUNT(*) FROM message_reactions WHERE message_id = ? AND reaction_type = 'support') as support
      `, [messageId, messageId, messageId]);

      // Broadcast update
      const message = await db.get('SELECT room_id FROM chat_messages WHERE id = ?', [messageId]);
      if (message) {
        io.to(`room-${message.room_id}`).emit('reaction-update', {
          messageId: parseInt(messageId),
          reactions: counts
        });
      }

      res.json({ reactions: counts });
    } catch (e) {
      console.error('Reaction error:', e);
      res.status(500).json({ error: 'Failed to react' });
    }
  });

  // Wellness Goals
  app.get('/api/wellness', authenticateToken, async (req: any, res) => {
    const today = new Date().toISOString().split('T')[0];
    const goals = await db.query('SELECT * FROM wellness_goals WHERE user_id = ? AND date = ?', [req.user.id, today]);
    res.json(goals);
  });

  app.post('/api/wellness/toggle', authenticateToken, async (req: any, res) => {
    const { goal_type } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const existing = await db.get('SELECT * FROM wellness_goals WHERE user_id = ? AND goal_type = ? AND date = ?', [req.user.id, goal_type, today]);
    
    if (existing) {
      await db.run('UPDATE wellness_goals SET is_completed = ? WHERE id = ?', [existing.is_completed ? 0 : 1, existing.id]);
    } else {
      await db.run('INSERT INTO wellness_goals (user_id, goal_type, is_completed, date) VALUES (?, ?, 1, ?)', [req.user.id, goal_type, today]);
    }
    res.sendStatus(200);
  });

  // Counselors
  app.get('/api/counselors', authenticateToken, async (req, res) => {
    const counselors = await db.query("SELECT * FROM counselors WHERE status = 'active' ORDER BY is_available DESC, name ASC");
    res.json(counselors);
  });

  // Counselor Portal Endpoints
  app.get('/api/counselor/dashboard', authenticateToken, authorizeRole(['counselor']), async (req: any, res) => {
    const counselor = await db.get('SELECT * FROM counselors WHERE user_id = ?', [req.user.id]);
    if (!counselor) return res.status(404).json({ error: 'Counselor profile not found' });

    const appointments = await db.query(`
      SELECT a.*, u.username as student_name, u.anonymous_alias as student_alias
      FROM appointments a
      JOIN users u ON a.student_id = u.id
      WHERE a.counselor_id = ? AND a.start_time >= date('now')
      ORDER BY a.start_time ASC
    `, [counselor.id]);

    const pendingRequests = await db.get("SELECT COUNT(*) as count FROM appointments WHERE counselor_id = ? AND status = 'pending'", [counselor.id]);
    
    // Recent mood alerts (students with many sad moods)
    const alerts = await db.query(`
      SELECT u.id, u.anonymous_alias, COUNT(m.id) as sad_count
      FROM users u
      JOIN mood_logs m ON u.id = m.user_id
      WHERE m.emoji IN ('😞', '😢', '😫') AND m.created_at >= date('now', '-7 days')
      GROUP BY u.id
      HAVING sad_count >= 3
    `);

    res.json({ profile: counselor, appointments, pendingCount: pendingRequests.count, alerts });
  });

  app.post('/api/appointments/:id/status', authenticateToken, authorizeRole(['counselor']), async (req, res) => {
    const { status } = req.body;
    await db.run('UPDATE appointments SET status = ? WHERE id = ?', [status, req.params.id]);
    res.sendStatus(200);
  });

  app.get('/api/counselor/student/:id/insights', authenticateToken, authorizeRole(['counselor']), async (req, res) => {
    const moods = await db.query('SELECT * FROM mood_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [req.params.id]);
    const student = await db.get('SELECT anonymous_alias FROM users WHERE id = ?', [req.params.id]);
    res.json({ moods, student });
  });

  app.post('/api/session-notes', authenticateToken, authorizeRole(['counselor']), async (req: any, res) => {
    const { studentId, notes } = req.body;
    const counselor = await db.get('SELECT id FROM counselors WHERE user_id = ?', [req.user.id]);
    await db.run('INSERT INTO session_notes (counselor_id, student_id, notes) VALUES (?, ?, ?)', [counselor.id, studentId, notes]);
    res.sendStatus(201);
  });

  app.get('/api/session-notes/:studentId', authenticateToken, authorizeRole(['counselor']), async (req: any, res) => {
    const counselor = await db.get('SELECT id FROM counselors WHERE user_id = ?', [req.user.id]);
    const notes = await db.query('SELECT * FROM session_notes WHERE counselor_id = ? AND student_id = ? ORDER BY created_at DESC', [counselor.id, req.params.studentId]);
    res.json(notes);
  });

  // Admin Portal Endpoints
  app.get('/api/admin/stats', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const stats = {
      totalStudents: (await db.get("SELECT COUNT(*) as count FROM users WHERE role = 'student'")).count,
      activeToday: (await db.get("SELECT COUNT(DISTINCT user_id) as count FROM mood_logs WHERE created_at >= date('now')")).count,
      totalCounselors: (await db.get("SELECT COUNT(*) as count FROM counselors WHERE status = 'active'")).count,
      openReports: (await db.get("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'")).count
    };
    res.json(stats);
  });

  app.get('/api/admin/users', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const users = await db.query('SELECT id, username, full_name, anonymous_alias, role, status, user_status, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  });

  app.post('/api/admin/users/:id/status', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { status } = req.body;
    await db.run('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    res.sendStatus(200);
  });

  app.get('/api/admin/counselors', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
      const counselors = await db.query(`
        SELECT c.*, u.username, u.status as user_status, u.created_at as user_created_at
        FROM counselors c
        LEFT JOIN users u ON c.user_id = u.id
        ORDER BY c.id DESC
      `);
      res.json(counselors);
    } catch (e: any) {
      console.error('Admin counselors error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/admin/counselors/:id/status', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { status } = req.body;
    await db.run('UPDATE counselors SET status = ? WHERE id = ?', [status, req.params.id]);
    // Also update user role if approved? Usually role is already counselor
    res.sendStatus(200);
  });

  app.get('/api/admin/reports', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const reports = await db.query(`
      SELECT r.*, m.message, m.created_at as message_created_at,
             reporter.username as reported_by_name,
             reporter.anonymous_alias as reported_by_alias,
             author.anonymous_alias as message_author_alias,
             author.username as message_author_username,
             rooms.name as room_name
      FROM reports r
      JOIN chat_messages m ON r.message_id = m.id
      JOIN users reporter ON r.reported_by = reporter.id
      JOIN users author ON m.user_id = author.id
      JOIN rooms ON m.room_id = rooms.id
      WHERE r.status = 'pending'
      ORDER BY r.created_at DESC
    `);
    res.json(reports);
  });

  app.post('/api/admin/reports/:id/resolve', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { action } = req.body; // 'delete', 'dismiss'
    const report = await db.get('SELECT message_id FROM reports WHERE id = ?', [req.params.id]);
    if (action === 'delete') {
      await db.run('DELETE FROM chat_messages WHERE id = ?', [report.message_id]);
      await db.run('INSERT INTO system_logs (event_type, message) VALUES (?, ?)', ['REPORT_RESOLVED', `Message deleted for report #${req.params.id}`]);
    } else {
      await db.run('INSERT INTO system_logs (event_type, message) VALUES (?, ?)', ['REPORT_DISMISSED', `Report #${req.params.id} dismissed`]);
    }
    await db.run('UPDATE reports SET status = "resolved" WHERE id = ?', [req.params.id]);
    res.sendStatus(200);
  });

  app.post('/api/reports', authenticateToken, async (req: any, res) => {
    const { messageId, reason } = req.body;
    await db.run('INSERT INTO reports (message_id, reported_by, reason) VALUES (?, ?, ?)', [messageId, req.user.id, reason]);
    await db.run('INSERT INTO system_logs (event_type, message) VALUES (?, ?)', ['MESSAGE_REPORTED', `Message #${messageId} reported for: ${reason}`]);
    res.sendStatus(201);
  });

  app.get('/api/admin/rooms', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const rooms = await db.query(`
      SELECT r.*, u.username as creator_name,
             u.anonymous_alias as creator_alias,
             (SELECT COUNT(*) FROM chat_messages WHERE room_id = r.id) as message_count
      FROM rooms r
      LEFT JOIN users u ON r.created_by = u.id
      ORDER BY CASE r.status WHEN 'pending' THEN 0 WHEN 'active' THEN 1 ELSE 2 END, r.created_at DESC
    `);
    res.json(rooms);
  });

  app.post('/api/admin/rooms/:id/status', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { status } = req.body; // 'active', 'rejected'
    await db.run('UPDATE rooms SET status = ? WHERE id = ?', [status, req.params.id]);
    await db.run('INSERT INTO system_logs (event_type, message) VALUES (?, ?)', ['ROOM_STATUS_UPDATED', `Room #${req.params.id} status updated to ${status}`]);
    res.sendStatus(200);
  });

  app.get('/api/admin/logs', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const logs = await db.query('SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 50');
    res.json(logs);
  });

  // System Settings
  app.get('/api/system-settings', async (req, res) => {
    try {
      const settings = await db.query('SELECT setting_key, setting_value FROM system_settings');
      const settingsMap = settings.reduce((acc: any, s: any) => {
        acc[s.setting_key] = s.setting_value;
        return acc;
      }, {});
      res.json(settingsMap);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/admin/system-settings', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { settings } = req.body; // { mpesa_number: '...', account_number: '...' }
    try {
      for (const [key, value] of Object.entries(settings)) {
        await db.run('INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT(setting_key) DO UPDATE SET setting_value = ?, updated_at = CURRENT_TIMESTAMP', [key, value, value]);
      }
      res.sendStatus(200);
    } catch (e: any) {
      console.error('Update settings error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Appointments
  app.get('/api/appointments', authenticateToken, async (req: any, res) => {
    const appointments = await db.query(`
      SELECT a.*, c.name as counselor_name, c.photo_url as counselor_photo
      FROM appointments a
      JOIN counselors c ON a.counselor_id = c.id
      WHERE a.student_id = ?
      ORDER BY a.start_time ASC
    `, [req.user.id]);
    res.json(appointments);
  });

  app.post('/api/appointments', authenticateToken, async (req: any, res) => {
    const { counselorId, startTime, method, notes } = req.body;
    await db.run(`
      INSERT INTO appointments (student_id, counselor_id, start_time, method, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [req.user.id, counselorId, startTime, method, notes]);
    await db.run('INSERT INTO system_logs (event_type, message) VALUES (?, ?)', ['APPOINTMENT_BOOKED', `New appointment booked for student #${req.user.id}`]);
    res.sendStatus(201);
  });

  // --- Socket.io ---
  const notifyStaffOfCrisis = async (userId: number, message: string, source: string) => {
    try {
      const user = await db.get('SELECT username, anonymous_alias FROM users WHERE id = ?', [userId]);
      if (!user) return;

      const alertMessage = `CRITICAL ALERT: Crisis detected for ${user.anonymous_alias} (Source: ${source})`;
      
      // Notify all counselors and admins about critical alert
      const staff = await db.query("SELECT id FROM users WHERE role IN ('counselor', 'admin')");
      staff.forEach(s => {
        const staffSockets = userSockets.get(s.id);
        if (staffSockets) {
          staffSockets.forEach(sid => {
            io.to(sid).emit('notification', {
              title: 'CRITICAL AI ALERT',
              body: alertMessage,
              data: { type: 'AI_ALERT', userId, alias: user.anonymous_alias }
            });
          });
        }
      });

      // Log it
      await db.run('INSERT INTO system_logs (event_type, message) VALUES (?, ?)', ['STAFF_NOTIFIED_CRISIS', `Staff alerted about ${user.username} (${user.anonymous_alias}) via ${source}`]);
    } catch (e) {
      console.error('Error notifying staff of crisis:', e);
    }
  };

  io.on('connection', (socket) => {
    socket.on('authenticate', (userId) => {
      if (!userId) return;
      const sockets = userSockets.get(userId) || [];
      if (!sockets.includes(socket.id)) {
        sockets.push(socket.id);
        userSockets.set(userId, sockets);
      }
      (socket as any).userId = userId;
      console.log(`User ${userId} authenticated on socket ${socket.id}`);
    });

    socket.on('disconnect', () => {
      const userId = (socket as any).userId;
      if (userId) {
        const sockets = userSockets.get(userId) || [];
        const index = sockets.indexOf(socket.id);
        if (index > -1) {
          sockets.splice(index, 1);
          if (sockets.length === 0) {
            userSockets.delete(userId);
          } else {
            userSockets.set(userId, sockets);
          }
        }
      }
    });

    socket.on('join-room', (roomId) => {
      socket.join(`room-${roomId}`);
    });

    socket.on('send-message', async (data) => {
      try {
        const { roomId, userId, message } = data;
        if (!roomId || !userId || !message) return;

        const result = await db.run('INSERT INTO chat_messages (room_id, user_id, message) VALUES (?, ?, ?)', [roomId, userId, message]);
        const user = await db.get('SELECT id, username, role, full_name, anonymous_alias FROM users WHERE id = ?', [userId]);
        
        if (user) {
          const messageData = {
            id: result.lastInsertRowid,
            room_id: roomId,
            user_id: userId,
            message,
            author_alias: user.role === 'student' ? user.anonymous_alias : `${user.full_name || 'Staff'} (${user.role.toUpperCase()})`,
            created_at: new Date().toISOString()
          };

          io.to(`room-${roomId}`).emit('new-message', messageData);

          // Notify users in the room who aren't active or on different tabs
          // For now, we'll send a generic notification to all users who have joined this room
          // but aren't currently "active" in the UI (this logic would be more complex in a real app)
          // Simplified: send a notification event to everyone in the room except the sender
          socket.to(`room-${roomId}`).emit('notification', {
            title: `New message in ${roomId}`,
            body: `${messageData.author_alias}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
            data: { type: 'CHAT_MESSAGE', roomId }
          });

          // MindCare AI Crisis Detection
          if (detectCrisis(message)) {
            const supportMsg = generateSupportMessage("CRITICAL");
            await db.run('INSERT INTO ai_notifications (user_id, message, type) VALUES (?, ?, ?)', [userId, supportMsg, 'CRITICAL_ALERT']);
            await db.run('INSERT INTO ai_alerts (user_id, alert_level, trigger_phrase, source) VALUES (?, ?, ?, ?)', [userId, 'CRITICAL', message, 'CHAT']);
            await db.run('UPDATE users SET user_status = ? WHERE id = ?', ['high_priority_support', userId]);
            await db.run('INSERT INTO system_logs (event_type, message) VALUES (?, ?)', ['CRISIS_DETECTED', `Crisis phrase detected in chat from user ${user.username}`]);
            
            socket.emit('ai-critical-alert', { message: supportMsg });

            // Notify all counselors and admins about critical alert
            await notifyStaffOfCrisis(userId, message, 'Chat Message');
          }
        }
      } catch (e) {
        console.error('Socket send-message error:', e);
      }
    });

    socket.on('report-message', async (data) => {
      const { messageId, reason } = data;
      await db.run('UPDATE chat_messages SET is_reported = 1, report_reason = ? WHERE id = ?', [reason, messageId]);
    });
  });

  app.get('/api/counselor/profile', authenticateToken, authorizeRole(['counselor']), async (req: any, res) => {
    const counselor = await db.get('SELECT * FROM counselors WHERE user_id = ?', [req.user.id]);
    if (!counselor) return res.status(404).json({ error: 'Counselor profile not found' });
    res.json(counselor);
  });

  app.post('/api/counselor/profile', authenticateToken, authorizeRole(['counselor']), async (req: any, res) => {
    const { name, specialties, bio, photo_url, phone_number, is_available } = req.body;
    await db.run('UPDATE counselors SET name = ?, specialties = ?, bio = ?, photo_url = ?, phone_number = ?, is_available = ? WHERE user_id = ?', [name, specialties, bio, photo_url, phone_number, is_available ? 1 : 0, req.user.id]);
    res.sendStatus(200);
  });

  // MindCare AI Routes
  app.get('/api/ai/notifications', authenticateToken, async (req: any, res) => {
    const notifications = await db.query('SELECT * FROM ai_notifications WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(notifications);
  });

  app.post('/api/ai/notifications', authenticateToken, async (req: any, res) => {
    const { message, type, distressLevel } = req.body;
    try {
      await db.run('INSERT INTO ai_notifications (user_id, message, type) VALUES (?, ?, ?)', [req.user.id, message, type || 'SUPPORT_TIP']);
      
      if (distressLevel) {
        await db.run('INSERT INTO ai_activity (user_id, analysis_type, result) VALUES (?, ?, ?)', [req.user.id, 'MOOD_ASSESSMENT', distressLevel]);
        
        if (distressLevel === 'CRITICAL') {
          await db.run('INSERT INTO ai_alerts (user_id, alert_level, trigger_phrase, source) VALUES (?, ?, ?, ?)', [req.user.id, 'CRITICAL', 'AI Assessment Detected High Distress', 'AI_ASSESSMENT']);
          await db.run('UPDATE users SET user_status = ? WHERE id = ?', ['high_priority_support', req.user.id]);
          await notifyStaffOfCrisis(req.user.id, 'MindCare AI Assessment detected critical distress', 'AI Assessment');
        }
      }
      
      res.sendStatus(201);
    } catch (e: any) {
      console.error('Create AI notification error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/ai/notifications/:id/read', authenticateToken, async (req: any, res) => {
    await db.run('UPDATE ai_notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.sendStatus(200);
  });

  app.get('/api/admin/ai/alerts', authenticateToken, authorizeRole(['admin', 'counselor']), async (req, res) => {
    const alerts = await db.query(`
      SELECT a.*, u.username, u.anonymous_alias, u.role
      FROM ai_alerts a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
    `);
    res.json(alerts);
  });

  app.delete('/api/admin/messages/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    await db.run('DELETE FROM chat_messages WHERE id = ?', [req.params.id]);
    res.sendStatus(200);
  });

  // Crisis Resources
  app.get('/api/crisis-resources', authenticateToken, async (req, res) => {
    const resources = await db.query('SELECT * FROM crisis_resources ORDER BY category ASC');
    res.json(resources);
  });

  app.post('/api/admin/crisis-resources', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { title, description, contact, category } = req.body;
    await db.run('INSERT INTO crisis_resources (title, description, contact, category) VALUES (?, ?, ?, ?)', [title, description, contact, category]);
    await db.run('INSERT INTO system_logs (event_type, message) VALUES (?, ?)', ['CRISIS_RESOURCE_ADDED', `New crisis resource added: ${title}`]);
    res.sendStatus(201);
  });

  app.put('/api/admin/crisis-resources/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { title, description, contact, category } = req.body;
    await db.run('UPDATE crisis_resources SET title = ?, description = ?, contact = ?, category = ? WHERE id = ?', [title, description, contact, category, req.params.id]);
    await db.run('INSERT INTO system_logs (event_type, message) VALUES (?, ?)', ['CRISIS_RESOURCE_UPDATED', `Crisis resource updated: ${title}`]);
    res.sendStatus(200);
  });

  app.delete('/api/admin/crisis-resources/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    await db.run('DELETE FROM crisis_resources WHERE id = ?', [req.params.id]);
    await db.run('INSERT INTO system_logs (event_type, message) VALUES (?, ?)', ['CRISIS_RESOURCE_DELETED', `Crisis resource deleted: ID #${req.params.id}`]);
    res.sendStatus(200);
  });

  // --- Background Tasks ---
  setInterval(async () => {
    try {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

      // Check for 1h reminders (only if > 15m away)
      const upcoming1h = await db.query(`
        SELECT a.*, c.name as counselor_name, u.username as student_name, u.full_name as student_full_name
        FROM appointments a
        JOIN counselors c ON a.counselor_id = c.id
        JOIN users u ON a.student_id = u.id
        WHERE a.status = 'approved' 
        AND a.reminder_1h_sent = 0 
        AND datetime(a.start_time) <= datetime(?)
        AND datetime(a.start_time) > datetime(?)
      `, [oneHourFromNow.toISOString(), fifteenMinutesFromNow.toISOString()]);

      for (const appt of upcoming1h) {
        const studentMsg = `Reminder: Your appointment with ${appt.counselor_name} starts in 1 hour.`;
        const counselorMsg = `Reminder: Your appointment with ${appt.student_full_name || appt.student_name} starts in 1 hour.`;

        // Send to student
        await db.run('INSERT INTO ai_notifications (user_id, message, type) VALUES (?, ?, ?)', [appt.student_id, studentMsg, 'APPOINTMENT_REMINDER']);
        // Send to counselor
        const counselorUser = await db.get('SELECT user_id FROM counselors WHERE id = ?', [appt.counselor_id]);
        if (counselorUser) {
          await db.run('INSERT INTO ai_notifications (user_id, message, type) VALUES (?, ?, ?)', [counselorUser.user_id, counselorMsg, 'APPOINTMENT_REMINDER']);
        }

        // Mark as sent
        await db.run('UPDATE appointments SET reminder_1h_sent = 1 WHERE id = ?', [appt.id]);
        
        // Log simulated email/push
        console.log(`[SIMULATED PUSH/EMAIL] Sent 1h reminder for appointment #${appt.id}`);
      }

      // Check for 15m reminders
      const upcoming15m = await db.query(`
        SELECT a.*, c.name as counselor_name, u.username as student_name, u.full_name as student_full_name
        FROM appointments a
        JOIN counselors c ON a.counselor_id = c.id
        JOIN users u ON a.student_id = u.id
        WHERE a.status = 'approved' 
        AND a.reminder_15m_sent = 0 
        AND datetime(a.start_time) <= datetime(?)
        AND datetime(a.start_time) > datetime(?)
      `, [fifteenMinutesFromNow.toISOString(), now.toISOString()]);

      for (const appt of upcoming15m) {
        const studentMsg = `Urgent Reminder: Your appointment with ${appt.counselor_name} starts in 15 minutes!`;
        const counselorMsg = `Urgent Reminder: Your appointment with ${appt.student_full_name || appt.student_name} starts in 15 minutes!`;

        // Send to student
        await db.run('INSERT INTO ai_notifications (user_id, message, type) VALUES (?, ?, ?)', [appt.student_id, studentMsg, 'APPOINTMENT_REMINDER']);
        // Send to counselor
        const counselorUser = await db.get('SELECT user_id FROM counselors WHERE id = ?', [appt.counselor_id]);
        if (counselorUser) {
          await db.run('INSERT INTO ai_notifications (user_id, message, type) VALUES (?, ?, ?)', [counselorUser.user_id, counselorMsg, 'APPOINTMENT_REMINDER']);
        }

        // Mark as sent
        await db.run('UPDATE appointments SET reminder_15m_sent = 1 WHERE id = ?', [appt.id]);
        
        // Log simulated email/push
        console.log(`[SIMULATED PUSH/EMAIL] Sent 15m reminder for appointment #${appt.id}`);
      }
    } catch (e) {
      console.error('Background reminder task error:', e);
    }
  }, 60000); // Check every minute

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('FAILED TO START SERVER:', err);
  process.exit(1);
});
