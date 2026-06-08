import { Pool } from 'pg';

// 1. Connect to PostgreSQL
export const pool = new Pool({
  user: 'archit.narayan', // Use your exact Mac username instead of 'postgres'
  host: '127.0.0.1',      // Forcing IPv4 to prevent IPv6 issues (::1)
  database: 'postgres',   // Keep this as 'postgres' (the default database name)
  password: '',           // Clear this out completely (Homebrew defaults to no password)
  port: 5432,
});