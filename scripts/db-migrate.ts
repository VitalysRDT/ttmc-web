/**
 * Applique les migrations SQL de drizzle/ directement via pg.
 * Alternative à `drizzle-kit push` qui nécessite un TTY interactif.
 *
 * Usage: npx tsx scripts/db-migrate.ts
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { Pool } from 'pg';

loadDotenv({ path: path.join(__dirname, '..', '.env.local') });

const MIGRATIONS_DIR = path.join(__dirname, '..', 'drizzle');

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL non défini dans .env.local');
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    console.log(`📦 Application de ${file}...`);
    const content = readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    const statements = content
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const stmt of statements) {
      try {
        await pool.query(stmt);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('already exists')) {
          console.log(`   (skip, déjà existant)`);
          continue;
        }
        console.error(`❌ Échec sur : ${stmt.slice(0, 80)}...`);
        throw err;
      }
    }
    console.log(`   ✓ ${statements.length} statements appliqués`);
  }
  await pool.end();
  console.log('\n✅ Migrations terminées');
}

main().catch((err) => {
  console.error('\n❌ Erreur :', err);
  process.exit(1);
});
