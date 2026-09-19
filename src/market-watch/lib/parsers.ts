// Parse serialized data without executing any marketplace JavaScript.
export function balanced(text:string,start:number){const open=text[start],close=open==='['?']':'}';if(open!=='['&&open!=='{')throw Error('Expected data block');let depth=0,quote=false,escape=false;for(let i=start;i<text.length;i++){const c=text[i];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quote=false;continue}if(c==='"'){quote=true;continue}if(c===open)depth++;if(c===close){depth--;if(depth===0)return text.slice(start,i+1);}}throw Error('Incomplete data block');}
export function dataBlock(text:string,marker:string){const pos=text.indexOf(marker);if(pos<0)throw Error('Marketplace page format changed');return balanced(text,pos+marker.length);}
export function jsonBlock(text:string,marker:string){return JSON.parse(dataBlock(text,marker));}
// Svelte serializes object keys without quotes and permits .001 numerals.
export function svelteJSON(s:string){let out='',i=0;while(i<s.length){if(s[i]==='"'){const start=i++;while(i<s.length){if(s[i]==='\\'){i+=2;continue}if(s[i++]==='"')break}out+=s.slice(start,i);continue}const key=s.slice(i).match(/^([A-Za-z_$][\w$]*)(\s*):/);if(key){out+=JSON.stringify(key[1])+':';i+=key[0].length;continue}if(s[i]==='.'&&/\d/.test(s[i+1]||''))out+='0';out+=s[i++];}return JSON.parse(out);}
export function rscText(html:string){return [...html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)].map(m=>JSON.parse(m[1])).join('');}
export const canonicalId=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{64}i\d+$/i.test(v)?v.toLowerCase():null;
export const sats=(v:unknown)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>0?v:null;
