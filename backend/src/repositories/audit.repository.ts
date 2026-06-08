import { pool } from '../config/db';

export class AuditRepository {
  async logAction(userId: string, action: string, noteId: string): Promise<void> {
    const logId = crypto.randomUUID();
    await pool.query(
      'INSERT INTO audit_logs(id, user_id, action, note_id, timestamp) VALUES($1, $2, $3, $4, $5)',
      [logId, userId, action, noteId, new Date().toISOString()]
    );
  }
}