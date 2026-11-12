// Render still fallbacks from archived originals with software WebGL.
import {chromium} from 'playwright';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/, '');
if(!process.argv[2])throw Error('Pass the directory of archived original HTML sources.');
const archive=resolve(process.argv[2])+'/';
const works=JSON.parse(await readFile(root+'/public/data/collections/griffintown.json'));
await mkdir(root+'/public/images/griffintown',{recursive:true});const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),audit=[];
try{for(const work of works){const file=archive+work.id+'.head.html',html=await readFile(file,'utf8');
 const page=await browser.newPage({viewport:{width:1800,height:1600},deviceScaleFactor:1});await page.route('**/*',r=>r.abort());
 page.on('pageerror',e=>console.log('Artwork error',e.message));await page.setContent(html,{waitUntil:'load'});await page.locator('#view').waitFor({timeout:6000});await page.waitForTimeout(1500);
 const image=await page.locator('#view').screenshot();const {data,info}=await sharp(image).resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:90}).toBuffer({resolveWithObject:true});
 await writeFile(root+'/public/images/griffintown/'+work.id+'.webp',data);audit.push({id:work.id,name:work.meta.name,archivedSource:file,original:'https://ordinals.com/content/'+work.id,bytes:data.length,width:info.width,height:info.height});console.log(work.meta.name,info.width,info.height);await page.close();}
 await writeFile(root+'/docs/immersive/griffintown-images.json',JSON.stringify(audit,null,2)+'\n');}finally{await browser.close();}
