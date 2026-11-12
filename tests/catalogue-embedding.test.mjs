import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { secureResponse } from '../server/security-headers.js';

test('the browser permits Catalogue embedding and blocks unrelated parents and direct shop framing',async()=>{
    const browser=await chromium.launch({headless:true});
    try{
        for(const [parent,path,allowed] of [
            ['https://catalogue.gallery','/',true],
            ['https://www.catalogue.gallery','/about',true],
            ['https://unrelated.example','/',false],
            ['https://catalogue.gallery','/shop',false],
        ]){
            const page=await browser.newPage(),errors=[];
            page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
            await page.route('**/*',async route=>{
                const url=new URL(route.request().url());
                if(url.origin===parent)return route.fulfill({contentType:'text/html',body:`<iframe title="Artist website" src="https://lemonhaze.com${path}"></iframe>`});
                if(url.origin==='https://lemonhaze.com'){
                    const response=secureResponse(new Request(url),new Response('<h1>Lemonhaze embedded</h1>',{headers:{'Content-Type':'text/html','X-Frame-Options':'DENY'}}));
                    return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});
                }
                return route.abort();
            });
            await page.goto(parent+'/embed-check');
            if(allowed)await page.frameLocator('iframe').getByRole('heading',{name:'Lemonhaze embedded'}).waitFor();
            else assert.ok(errors.some(error=>/frame-ancestors|X-Frame-Options/i.test(error)),`${parent}${path} should be blocked`);
            await page.close();
        }
    }finally{await browser.close();}
});
