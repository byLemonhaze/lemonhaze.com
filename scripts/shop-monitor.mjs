// Read-only operational snapshot. No delivery details, tokens, or Stripe payloads.
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const sql=`SELECT id,status,needs_review,updated_at FROM shop_orders WHERE mode='live' AND (status='paid' OR needs_review=1) ORDER BY updated_at DESC LIMIT 100;
SELECT mode,status,started_at,finished_at,checked,needs_review FROM shop_monitor WHERE mode='live';
SELECT count(*) AS unresolved FROM shop_orders WHERE mode='live' AND needs_review=1;`;
try {
 const raw=execFileSync(process.execPath,[root+'node_modules/wrangler/bin/wrangler.js','d1','execute','lemonhaze-shop','--remote','--json','--command',sql],{cwd:root,encoding:'utf8',timeout:90000,stdio:['ignore','pipe','pipe'],maxBuffer:1024*1024});
 const tables=JSON.parse(raw);if(tables.length!==3||tables.some(t=>t.success!==true))throw Error('Invalid snapshot');
 const heartbeat=tables[1].results[0]||null;
 const healthy=!!heartbeat&&heartbeat.status==='ok'&&Date.now()/1000-heartbeat.finished_at<1800;
 console.log(JSON.stringify({checkedAt:new Date().toISOString(),healthy,heartbeat,unresolved:tables[2].results[0].unresolved,orders:tables[0].results}));
} catch {console.error('Shop monitor could not read its private snapshot. Check Cloudflare authentication and connectivity.');process.exitCode=1;}
