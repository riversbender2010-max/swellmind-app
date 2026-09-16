import { Pool } from 'pg'

const pool = new Pool({
  host:     process.env.SUPABASE_DB_HOST,
  port:     parseInt(process.env.SUPABASE_DB_PORT || '5432'),
  user:     process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  database: process.env.SUPABASE_DB_NAME || 'postgres',
  ssl:      { rejectUnauthorized: false },
  max: 3,
})

export default pool
