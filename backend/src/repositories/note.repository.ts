import { pool } from '../config/db';

export interface NoteRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
}

export class NoteRepository {
  async countByUserId(userId: string): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) FROM notes WHERE user_id = $1', [userId]);
    return parseInt(result.rows[0].count, 10);
  }

  async create(id: string, userId: string, title: string, content: string, createdAt: string): Promise<void> {
    await pool.query(
      'INSERT INTO notes(id, user_id, title, content, created_at) VALUES($1, $2, $3, $4, $5)',
      [id, userId, title, content, createdAt]
    );
  }

  async checkOwnership(noteId: string, userId: string): Promise<boolean> {
    const result = await pool.query('SELECT * FROM notes WHERE id = $1 AND user_id = $2', [noteId, userId]);
    return result.rows.length > 0;
  }

  async delete(noteId: string): Promise<void> {
    await pool.query('DELETE FROM notes WHERE id = $1', [noteId]);
  }

// Add inside the NoteRepository class
async update(noteId: string, title: string, content: string): Promise<NoteRow> {
  const result = await pool.query(
    'UPDATE notes SET title = $1, content = $2 WHERE id = $3 RETURNING *',
    [title, content, noteId]
  );
  return result.rows[0];
}

async findAllByUserId(userId: string): Promise<NoteRow[]> {
  const result = await pool.query(
    'SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}
}