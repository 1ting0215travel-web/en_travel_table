import fs from 'node:fs/promises';
import { Client } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = await fs.readFile(new URL('../supabase_schema.sql', import.meta.url), 'utf8');

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query('begin');
  await client.query(sql);
  await client.query('commit');
  console.log('Schema applied successfully.');
} catch (err) {
  try {
    await client.query('rollback');
  } catch (rollbackErr) {
    console.error('Rollback failed:', rollbackErr);
  }
  console.error('Failed to apply schema:', err);
  process.exit(1);
} finally {
  await client.end();
}
