import { pool } from '../config/db';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
}

export class UserRepository {
  async findByEmail(email: string): Promise<UserRow | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  async create(id: string, email: string, passwordHash: string): Promise<void> {
    await pool.query(
      'INSERT INTO users(id, email, password_hash) VALUES($1, $2, $3)',
      [id, email, passwordHash]
    );
  }
}