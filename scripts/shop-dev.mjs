import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {handleShop} from '../server/shop/handler.js';
import {localDatabase} from '../server/shop/local-db.js';

let vars={};try{vars=parseEnv(readFileSync('.dev.vars','utf8'));}catch{}
if(vars.SHOP_MODE==='live'||/^(sk|rk)_live_/.test(vars.STRIPE_SECRET_KEY||''))throw new Error('The local shop server only accepts Stripe TEST credentials.');
const env={...vars,SHOP_MODE:'test',SHOP_ORIGIN:'http://127.0.0.1:5173',SHOP_DB:localDatabase()};
const server=createServer(async(req,res)=>{
  if(!req.url?.startsWith('/api/shop/')){res.writeHead(404).end();return;}
  try {
    const init={method:req.method,headers:req.headers};
    if(!['GET','HEAD'].includes(req.method)){init.body=req;init.duplex='half';}
    const result=await handleShop(new Request(`http://127.0.0.1:8788${req.url}`,init),env);
    res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
  }catch{res.writeHead(500,{'Content-Type':'application/json','Cache-Control':'no-store'}).end('{"error":"Local checkout is unavailable."}');}
});
server.listen(8788,'127.0.0.1',()=>console.log('Local test checkout API: http://127.0.0.1:8788 — test inventory is in memory and resets on restart.'));
