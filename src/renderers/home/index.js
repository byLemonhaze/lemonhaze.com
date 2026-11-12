// The Website entry is an index into the existing pages. The selected artwork
// sequence and its introduction belong to /selected, rather than appearing twice.
export function renderHomeView({galleryGrid,onNavigate}) {
    if(!galleryGrid)return ()=>{};
    galleryGrid.replaceChildren();galleryGrid.className='website-entry';
    const content=galleryGrid.closest('#content-area');if(content)content.style.overflowY='auto';
    const entry=document.createElement('div');entry.className='website-index';
    entry.innerHTML=`<nav class="website-index-pages" aria-label="Inside the website">
        <a href="/selected">Selected works</a><a href="/practice">Practice</a><a href="/about">About</a><a href="/highlights">Exhibitions</a>
        </nav><figure class="website-studio-image"><a href="/archive#good-night-print" aria-label="Good Night at the print table"><img src="/editorial/archive/m044.webp" alt="Good Night at the print table" width="900" height="1200"></a></figure>`;
    const further=document.createElement('nav');further.className='website-further';further.setAttribute('aria-label','Further into the studio');
    further.innerHTML='<a href="/all-works">All Works</a><a href="/archive">Studio notes</a><a href="/collecting">Collecting</a><a href="/shop">Print shop</a><a href="/lab">Lab</a>';
    galleryGrid.append(entry,further);
    const navigate=event=>{
        const link=event.target.closest('a[href]');
        if(!link||!onNavigate||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
        const url=new URL(link.href,location.href);
        if(url.origin!==location.origin||link.target==='_blank'||link.hasAttribute('download'))return;
        event.preventDefault();onNavigate(url.pathname+url.search+url.hash);
    };
    entry.addEventListener('click',navigate);further.addEventListener('click',navigate);
    return ()=>{galleryGrid.replaceChildren();};
}
