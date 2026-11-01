// Backup del database: un file JSON per tabella in backups/<data-ora>/, più _counts.json
// con il numero di righe. Tutte le tabelle sono lette nella stessa transazione, quindi il
// backup è coerente anche con il sito acceso.
//
//   npm run db:backup
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import pg from "pg";

const stamp = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
const dir = new URL(`../backups/${stamp}/`, import.meta.url);
mkdirSync(dir, { recursive: true });

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const { rows: tables } = await client.query(
    "select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by 1",
  );
  const counts = {};
  for (const { table_name: t } of tables) {
    const { rows } = await client.query(`select * from "${t}"`);
    writeFileSync(new URL(`${t}.json`, dir), JSON.stringify(rows, null, 2));
    counts[t] = rows.length;
  }
  await client.query("COMMIT");
  writeFileSync(new URL("_counts.json", dir), JSON.stringify(counts, null, 2));
  console.log(`Backup in ${dir.pathname}`);
  console.log(counts);
} finally {
  await client.end();
}
