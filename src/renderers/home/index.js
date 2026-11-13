// The Website entry is an index into the existing pages. The selected artwork
// sequence and its introduction belong to /selected, rather than appearing twice.
export function renderHomeView({galleryGrid,onNavigate}) {
    if(!galleryGrid)return ()=>{};
    galleryGrid.replaceChildren();galleryGrid.className='website-entry';
    const content=galleryGrid.closest('#content-area');if(content)content.style.overflowY='auto';
    const entry=document.createElement('div');entry.className='website-index';
    entry.innerHTML=`<div class="website-index-navigation"><nav class="website-index-pages" aria-label="Inside the website">
        <a href="/selected">Selected works</a><a href="/practice">Practice</a><a href="/about">About</a><a href="/highlights">Exhibitions</a>
        </nav></div><figure class="website-studio-image"><a href="/757c7d19f53501b9f1e11f49f1731622d5d257eed99c721b32af0438d0d1f9cfi0" aria-label="Gentleman Nº1"><img src="/editorial/gentleman-01-framed.png" alt="Gentleman Nº1 — floating-frame presentation study" width="1254" height="1254"></a></figure>`;
    const further=document.createElement('nav');further.className='website-further';further.setAttribute('aria-label','Further into the studio');
    further.innerHTML='<a href="/all-works">All Works</a><a href="/archive">Studio notes</a><a href="/collecting">Collecting</a><a href="/shop">Print shop</a><a href="/lab">Lab</a>';
    entry.querySelector('.website-index-navigation').append(further);
    const policies=document.createElement('nav');policies.className='website-index-policies';policies.setAttribute('aria-label','Policies');
    policies.innerHTML='<a href="/privacy.html">Privacy</a><a href="/terms.html">Terms &amp; contact</a>';
    entry.querySelector('.website-index-navigation').append(policies);
    galleryGrid.append(entry);
    const navigate=event=>{
        const link=event.target.closest('a[href]');
        if(!link||!onNavigate||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
        const url=new URL(link.href,location.href);
        if(url.origin!==location.origin||link.target==='_blank'||link.hasAttribute('download'))return;
        event.preventDefault();onNavigate(url.pathname+url.search+url.hash);
    };
    entry.addEventListener('click',navigate);
    return ()=>{galleryGrid.replaceChildren();};
}
