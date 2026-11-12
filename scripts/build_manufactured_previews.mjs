// Create sharp display derivatives from the artist CDN; originals stay unchanged.
import {readFile,writeFile,mkdir,access,unlink} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,''),run=promisify(execFile);
const works=JSON.parse(await readFile(root+'/public/data/provenance.json')).filter(w=>w.collection==='Manufactured');
await mkdir(root+'/public/images/manufactured',{recursive:true});
let done=0;const errors=[],audit=[];
const previous=JSON.parse(await readFile(root+'/docs/immersive/manufactured-images.json').catch(()=>'{"audit":[]}'));
const cached=new Map(previous.audit.map(entry=>[entry.id,entry]));
await Promise.all(Array.from({length:4},async()=>{while(works.length){
 const w=works.shift(),out=root+'/public/images/manufactured/'+w.id+'.webp',tmp='/tmp/manufactured-source-'+w.id;
 try{
  try{await access(out);if(!cached.has(w.id))throw Error('Missing audit');audit.push(cached.get(w.id));continue;}catch{}
  const src='https://cdn.lemonhaze.com/assets/assets/'+w.id+'.png';
  await run('curl',['-f','-sS','-L','--retry','2','--max-time','40',src,'-o',tmp]);
  const input=await readFile(tmp),{data,info}=await sharp(input,{limitInputPixels:300000000}).resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:86}).toBuffer({resolveWithObject:true});
  await writeFile(out,data);audit.push({id:w.id,source:src,inputBytes:input.length,bytes:data.length,width:info.width,height:info.height});
 }catch(e){errors.push({id:w.id,message:e.message});}
 finally{await unlink(tmp).catch(()=>{});if(++done%25===0)console.log(done,'done',errors.length,'failed');}
}}));
await writeFile(root+'/docs/immersive/manufactured-images.json',JSON.stringify({audit,errors},null,2)+'\n');console.log('Finished',done,errors);
