// Node-only test/local adapter. Production uses Cloudflare D1, never this module.
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
export function localDatabase() {
  const sql=new DatabaseSync(':memory:');
  sql.exec('PRAGMA foreign_keys=ON');
  const migrations=new URL('../../db/shop-migrations/',import.meta.url);
  for(const file of readdirSync(migrations).filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync(new URL(file,migrations),'utf8'));
  const db={
    prepare(query) {
      const stmt=sql.prepare(query);let values=[];
      return {
        bind(...args){values=args;return this;},
        async first(){return stmt.get(...values)||null;},
        async all(){return {results:stmt.all(...values)};},
        async run(){return {meta:stmt.run(...values)};},
        execute(){return stmt.run(...values);}
      };
    },
    async batch(statements) {
      sql.exec('BEGIN IMMEDIATE');
      try{const result=statements.map(s=>s.execute());sql.exec('COMMIT');return result;}catch(error){sql.exec('ROLLBACK');throw error;}
    },
    close(){sql.close();}
  };
  return db;
}
