import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

// One-shot production migration runner. In the Docker image the compiled
// output lives at dist/infrastructure/db/migrate.js and the SQL migrations
// are copied to <workdir>/migrations (see apps/api/Dockerfile).
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  await migrate(db, {
    migrationsFolder: process.env.MIGRATIONS_FOLDER ?? 'migrations',
  });

  await pool.end();
  console.log('Migrations applied');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
