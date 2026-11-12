import {uniqueOriginals} from '../immersive/roster.js';
import {collectionChronology} from '../utils/collection-chronology.js';
import { CHRONOLOGY_BY_YEAR } from '../data.js';
import { thumbnailSource, browsingSource } from '../immersive/model.js';
import { COLLECTION_LEAD_ARTWORK_IDS } from '../app/collection-flow.js';
import ethereumWorks from '../data/ethereum-works.json' with {type:'json'};

const COLLECTION_COVERS = {
    'Games': [
        'a8a5a579fca077d96d76068a55be8466041935c31cf11b7d697098f962574edai0',
        '0a20ef85c7deae03895d6eb3a6fb735a551b56dcc5ec67a619bdfc0c4986b3dbi0',
        '013199880d4ff9cb26d0414f894178f776ddfc59858c15bc4aca993b44c8b523i0',
    ],
    'Tin Box of Solitude': [
        'bc13c49dd637343e7f91a86175bd800440f5aef118b518a6b35b3a77ea83ee77i0',
        '0c2dea85121eb7b98bb3d7ffe182629ba15513bdbdd4619b4e0c0448bdcf6284i0',
        '3a4a26077f9d3a3199356813814e030f0152084404f62755c4079db0e7315e86i0',
    ],
    'La Tentation': [
        'e1c02e043a33ecbef4c168fca6a68122ed652699199bf0b074837ec37171966di0',
        '30f142a6afbc1ef995c77f5c4785ae2e7937e729fdd85c1ab75531fad3a8667ci0',
        'daf064a28fd61c3f6fdaa223a8f9080c60635c3caf691c3accc6f8f0a8935b93i0',
    ],
    'Manufactured': [
        'fe7de1e35036400088171f4419c9d231b37420d63db6653c6acc4b44bf3885fbi75',
        'fe7de1e35036400088171f4419c9d231b37420d63db6653c6acc4b44bf3885fbi5',
        'fe7de1e35036400088171f4419c9d231b37420d63db6653c6acc4b44bf3885fbi105',
    ],
    '1 of 1s (2025)': [
        '627d9a054e2db14bc892cec8a747da726dbadc1677079ff49675b17f78e262d8i0',
        'b32cc2fbacb3aa3b83408a8426873a3a649291da44538a462d76b3a84699f1e9i0',
        '611fad09e407fe63e70c54ee853e755f92cb4d69049eff21f31d3d414a2db74di0',
    ],
    'Gentlemen': [
        '757c7d19f53501b9f1e11f49f1731622d5d257eed99c721b32af0438d0d1f9cfi0',
        'd17d6c2e96c9b129ec1fbb9a21742e06a063976494d306f6b4086a519913cc92i0',
        '85ced879b0ea14b10e82b55242b415c66b942c0ffc7248c3621ed6de3f21ac20i0',
    ],
    'Miscellaneous': [
        '0638326aacbe6dbd0dc67357d8246ab35bbdefce239c2c6ac9750458ca143165i0',
        '433cff2aa89b8907f8c800c7e8675f085810ed2ed3fe5e1b6cbfb4d8d5ba43bci0',
        'a9a897a66f30bbf12460948241afbdffa18b4289fc1401f8a9e00c5fe1bbecd5i0',
    ],
    '1 of 1s (2026)': [
        '8364ada14a420eff704c0eeca009c8460769879fdfd70270ff4a3b1c92cbe482i0',
        'c8d790c42ce1a43c02acf15114d4053c1c9f086dc2856ebd3031ce268f5d58dbi0',
        'f1f114aee3aabe9539a9d4aff7619b1690e9656f53544c938725fbd4f3db3144i0',
    ],
};
const normalize=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function representativeWorks(works,leadIds=[]) {
    const artworks=works.filter(work=>work.role!=='parent'&&!leadIds.includes(work.id));
    const candidates=artworks.length?artworks:works;
    return [...new Set([0,Math.floor((candidates.length-1)/2),candidates.length-1])].map(index=>candidates[index]).filter(Boolean);
}
export function collectionIndex(artworks,toCollectionSlug) {
    const groups=new Map(),byId=new Map(artworks.map(work=>[work.id,work]));
    for(const work of artworks){
        if(!work.collection||work.collection==='Home'||work.collection==='Colors')continue;
        if(!groups.has(work.collection))groups.set(work.collection,[]);
        groups.get(work.collection).push(work);
    }
    for(const name of Object.values(CHRONOLOGY_BY_YEAR).flat())if(!groups.has(name))groups.set(name,[]);
    return [...groups].map(([name,works])=>{
        const authoredYear=Object.entries(CHRONOLOGY_BY_YEAR).find(([,names])=>names.includes(name))?.[0];
        const years=works.map(w=>String(w.year||w.timestamp||'').slice(0,4)).filter(y=>/^\d{4}$/.test(y));
        const chronology=collectionChronology(name,artworks);
        const year=chronology?String(new Date(chronology).getUTCFullYear()):authoredYear||years.sort().at(-1)||'Undated';
        let candidates=works;
        if(name==='Trilogy (Prints)'||name==='Satoshi (Original & Editions)')candidates=uniqueOriginals(works,byId);
        if(name==='1 of 1s (2025)')candidates=works.filter(work=>!['Off-Kilter','Glass Breaker','Mending Out'].includes(work.name));
        const covers=COLLECTION_COVERS[name]?.map(id=>byId.get(id)).filter(Boolean)
            ||representativeWorks(candidates,COLLECTION_LEAD_ARTWORK_IDS[name]);
        const ethereum=works[0]?.chain==='Ethereum';
        return {name,works,year,chronology,covers,ethereum,href:ethereum?works[0].marketplace:'/'+toCollectionSlug(name),search:normalize(name)};
    }).sort((a,b)=>(a.year==='Undated')-(b.year==='Undated')||b.year.localeCompare(a.year)||(b.chronology||0)-(a.chronology||0)||a.name.localeCompare(b.name));
}
export function searchCollections(index,query) {
    const term=normalize(query).trim();
    return index.map(group=>({...group,matches:term?group.works.filter(w=>normalize(w.name).includes(term)):[]}))
        .filter(group=>!term||group.search.includes(term)||group.year.includes(term)||group.matches.length);
}
export function createAllWorks(artworks,toCollectionSlug) {
    const root=document.createElement('div');root.className='all-works-page';
    root.innerHTML='<div class="catalogue-tools"><label for="all-works-search">Search works and collections<input id="all-works-search" type="search" placeholder="Title, collection or year" autocomplete="off"></label><a href="/visualizer/">Visual chronology</a></div><p class="catalogue-status" role="status" aria-live="polite"></p><nav class="catalogue-years" aria-label="Browse by year"></nav><div class="catalogue-groups"></div>';
    const index=collectionIndex([...artworks,...ethereumWorks],toCollectionSlug),input=root.querySelector('input'),groups=root.querySelector('.catalogue-groups'),years=root.querySelector('.catalogue-years'),status=root.querySelector('.catalogue-status');
    function render(){
        const found=searchCollections(index,input.value);groups.replaceChildren();years.replaceChildren();
        const matched=found.reduce((sum,group)=>sum+group.matches.length,0);
        const collectionCount=`${found.length} ${found.length===1?'collection':'collections'}`;
        status.textContent=found.length?(matched?`${matched} ${matched===1?'work':'works'} · ${collectionCount}`:collectionCount):'No matching works or collections.';
        for(const year of [...new Set(found.map(g=>g.year))]){
            const jump=document.createElement('a');jump.href='#catalogue-'+year;jump.textContent=year;years.append(jump);
            const section=document.createElement('section');section.id='catalogue-'+year;section.className='catalogue-year';
            const title=document.createElement('h2');title.textContent=year;section.append(title);
            const list=document.createElement('div');list.className='catalogue-collections';section.append(list);
            for(const group of found.filter(g=>g.year===year)){
                const card=document.createElement('article');card.className='catalogue-collection';
                const link=document.createElement('a');link.href=group.href;link.className='catalogue-collection-link';
                if(group.ethereum){link.target='_blank';link.rel='noopener noreferrer';}
                const label=document.createElement('span');label.className='catalogue-collection-name';label.textContent=group.name;
                if(group.matches.length){
                    card.classList.add('has-work-results');link.append(label);card.append(link);
                    const matches=document.createElement('div');matches.className='catalogue-work-results';card.append(matches);
                    let shown=0;
                    const more=document.createElement('button');more.type='button';more.className='catalogue-more';
                    function showMore(){
                        const next=group.matches.slice(shown,shown+12);shown+=next.length;
                        for(const work of next){
                            const result=document.createElement('a');result.href=work.marketplace||'/'+encodeURIComponent(work.id)+'?view=website';result.className='catalogue-work-result';
                            if(group.ethereum){result.target='_blank';result.rel='noopener noreferrer';}
                            const frame=document.createElement('span');frame.className='catalogue-result-image';
                            const img=new Image();img.src=work.preview||browsingSource(work,1,240);img.alt='';img.loading='lazy';img.decoding='async';frame.append(img);
                            const title=document.createElement('span');title.textContent=work.name;result.append(frame,title);matches.append(result);
                        }
                        more.hidden=shown>=group.matches.length;more.textContent=`Show more works (${group.matches.length-shown} remaining)`;
                    }
                    more.onclick=showMore;card.append(more);showMore();
                }else{
                    const frame=document.createElement('span');frame.className='catalogue-cover catalogue-cover-group';frame.dataset.coverCount=group.covers.length;
                    for(const work of group.covers){
                        const img=new Image();img.src=work.preview||thumbnailSource(work);img.alt='';img.loading='lazy';img.decoding='async';img.onerror=()=>img.remove();frame.append(img);
                    }
                    link.append(frame,label);card.append(link);
                    const count=document.createElement('p');count.className='catalogue-work-count';count.textContent=group.ethereum
                        ? `Ethereum · ${group.works[0].editions>1?`Edition of ${group.works[0].editions}`:'1 of 1'}`
                        : `${group.works.length} ${group.works.length===1?'work':'works'}`;card.append(count);
                }
                list.append(card);
            }
            groups.append(section);
        }
    }
    input.addEventListener('input',render);render();return root;
}
