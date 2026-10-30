// Database PostgreSQL locale per lo sviluppo, con i dati in .data/pgdata (esclusa da git).
// Avvio: npm run db  — resta in esecuzione finché non si preme Ctrl+C.
// Collegamento: DATABASE_URL="postgresql://postgres:postgres@localhost:54329/dppdesigner"
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import EmbeddedPostgres from "embedded-postgres";

const dataDir = fileURLToPath(new URL("../.data/pgdata", import.meta.url));
const fresh = !existsSync(`${dataDir}/PG_VERSION`);

const pg = new EmbeddedPostgres({ databaseDir: dataDir, user: "postgres", password: "postgres", port: 54329, persistent: true });

if (fresh) await pg.initialise();
await pg.start();
if (fresh) {
  await pg.createDatabase("dppdesigner");
  console.log("Database nuovo e vuoto: esegui npm run db:deploy e npm run db:seed");
}
console.log(`PostgreSQL pronto sulla porta 54329 (dati in ${dataDir})`);

// Arresto pulito: Postgres chiude i file prima di uscire
let stopping = false;
const stop = async () => {
  if (stopping) return;
  stopping = true;
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
