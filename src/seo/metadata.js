import { SOCIAL_IMAGES } from './social-images.js';
export const SITE_ORIGIN = 'https://lemonhaze.com';
const COLLECTION_SOCIAL_IMAGES = {
 '/chrysalis': 'c6a7aa6853e257c11fed5faa51d33772a11142425d0275075312f8c3e205668fi0',
 '/confabulation': 'd19688af2a36c04add06dc767117365f0f9c75b67be6170dbdfd76152b069b1ei0',
};
export const PAGE_METADATA = {
 '/': {name:'Lemonhaze — Artist & Coureur de Bois',description:'Explore Lemonhaze’s art on Bitcoin: generative painting, collections, artist notes, exhibitions, and the stories behind the work.'},
 '/selected': {name:'Selected Work',description:'A selection of works and series by Lemonhaze: black, ink-like forms, digital textures, generative images, and works inscribed on Bitcoin.'},
 '/about': {name:'About Lemonhaze',description:'Meet Lemonhaze, artist and coureur de bois. Discover the practice, background, and writing behind his art inscribed on Bitcoin.'},
 '/practice': {name:'Practice',description:'Explore Lemonhaze’s practice through Gentlemen, BEST BEFORE, Montreal, Paint Engine, and Liminality.'},
 '/archive': {name:'Studio Notes',description:'Stories, process photographs, artist writing and exhibition footage from Lemonhaze’s practice. Explore the connections behind the artworks on Bitcoin.'},
 '/gentleman-se-2025': {name:'Gentleman SE 2025 — Studio Writing',description:'Lemonhaze on texture, generative painting, selecting an output, and writing inside the artwork. Original reflections from Gentleman SE 2025.'},
 '/paint-engine': {name:'Paint Engine',description:'Explore Lemonhaze’s evolving generative paint engine, its textures, inscribed milestones, and an interactive study.'},
 '/collecting': {name:'Collecting',description:'How to view, download, display, and collect Lemonhaze’s artworks on Bitcoin, with guidance on original inscription content and high-resolution exports.'},
 '/highlights': {name:'Exhibitions & Press',description:'Lemonhaze’s exhibitions and career: Sotheby’s Contemporary Discoveries, Montreal at Suburbs Gallery, and presentations around the world.'},
 '/supply': {name:'Supply & Marketplace',description:'Explore Lemonhaze’s collection supply and Market Watch: public marketplace listings, cross-listed artworks, floors, and offers on Bitcoin.'},
 '/media': {name:'Media & Press',description:'Interviews, articles, and media coverage of Lemonhaze’s artwork, collections, and practice on Bitcoin.'},
 '/lab': {name:'Lab & Projects',description:'Explore platforms, experiments, and tools built by Lemonhaze alongside his artistic practice.'},
};
export function cleanDescription(value,limit=180) {
 const plain=String(value||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 if(plain.length<=limit)return plain;
 return plain.slice(0,limit-1).replace(/\s+\S*$/,'')+'…';
}
export function metadataFor({path,name,description,kind='page',image=null,collection=null}) {
 const page=PAGE_METADATA[path];
 const label=page?.name||name||'Lemonhaze';
 const title=path==='/'?label:`${label} | Lemonhaze`;
 const fallback=kind==='artwork'?`${label} by Lemonhaze${collection?`, from ${collection}`:''}. Explore the artwork, inscription details, and artist notes on Bitcoin.`:`${label} by Lemonhaze. Explore the collection, artworks, and writing on Bitcoin.`;
 const socialImage=SOCIAL_IMAGES[path.slice(1)]||SOCIAL_IMAGES[COLLECTION_SOCIAL_IMAGES[path]]||image||SOCIAL_IMAGES.default;
 const imageUrl=new URL(socialImage,SITE_ORIGIN).href;
 return {path,title,description:cleanDescription(page?.description||description||fallback),canonical:SITE_ORIGIN+path,image:imageUrl,kind,name:label};
}
export function applyMetadata(document,metadata) {
 document.title=metadata.title;
 const set=(selector,tag,attributes)=>{
  let el=document.head.querySelector(selector);if(!el){el=document.createElement(tag);document.head.append(el);}
  for(const [key,value] of Object.entries(attributes))el.setAttribute(key,value);
 };
 set('meta[name="description"]','meta',{name:'description',content:metadata.description});
 set('link[rel="canonical"]','link',{rel:'canonical',href:metadata.canonical});
 for(const [property,content] of Object.entries({'og:title':metadata.title,'og:description':metadata.description,'og:url':metadata.canonical,'og:type':'website','og:site_name':'Lemonhaze'}))set(`meta[property="${property}"]`,'meta',{property,content});
 set('meta[name="twitter:card"]','meta',{name:'twitter:card',content:metadata.image?'summary_large_image':'summary'});
 set('meta[name="twitter:site"]','meta',{name:'twitter:site',content:'@Ordinals10K'});
 set('meta[name="twitter:creator"]','meta',{name:'twitter:creator',content:'@Ordinals10K'});
 set('meta[name="twitter:image"]','meta',{name:'twitter:image',content:metadata.image});
 set('meta[name="twitter:image:alt"]','meta',{name:'twitter:image:alt',content:metadata.name+' by Lemonhaze'});
 if(metadata.image.startsWith(SITE_ORIGIN+'/social/')){
  for(const [property,content] of Object.entries({'og:image:width':'1200','og:image:height':'630','og:image:type':'image/jpeg'}))set(`meta[property="${property}"]`,'meta',{property,content});
 }else document.head.querySelectorAll('meta[property="og:image:width"],meta[property="og:image:height"],meta[property="og:image:type"]').forEach(el=>el.remove());
 if(metadata.image){set('meta[property="og:image"]','meta',{property:'og:image',content:metadata.image});set('meta[property="og:image:alt"]','meta',{property:'og:image:alt',content:metadata.name+' by Lemonhaze'});}
 else document.head.querySelectorAll('meta[property="og:image"],meta[property="og:image:alt"]').forEach(el=>el.remove());
 document.documentElement.dataset.seoPath=metadata.path;
}
