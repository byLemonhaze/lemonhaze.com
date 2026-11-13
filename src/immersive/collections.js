export const collectionEntry = (name,items) => name==='Selected works'?0:Math.floor((items.length-1)/2);

export function createCollectionPicker(collections,initial,onChange) {
    const root=document.createElement('div');root.className='room-collection';
    root.innerHTML='<button class="collection-trigger" type="button" aria-haspopup="dialog" aria-expanded="false"><span class="collection-name"></span><span class="collection-chevron" aria-hidden="true"></span></button>';
    // A native top-layer dialog stays above shared navigation, contains focus,
    // and isolates scrolling from the artwork carousel behind it.
    const menu=document.createElement('dialog');menu.className='collection-menu';menu.setAttribute('aria-label','Choose a collection');
    menu.innerHTML='<header><h2>Collections</h2><button type="button" class="collection-close" aria-label="Close collections">×</button></header><label><span class="sr-only">Find a collection</span><input type="search" aria-label="Find a collection" placeholder="Find a collection" autocomplete="off"></label><div class="collection-options"></div><p class="collection-empty" hidden>No matching collections</p>';
    document.body.append(menu);
    const trigger=root.querySelector('button'),name=root.querySelector('.collection-name'),search=menu.querySelector('input'),list=menu.querySelector('.collection-options'),empty=menu.querySelector('.collection-empty');
    const choices=new Map();let selected=initial;
    const viewport=window.visualViewport;
    function fit(){
        const height=viewport?.height||innerHeight,top=viewport?.offsetTop||0;
        menu.style.setProperty('--picker-height',`${height}px`);menu.style.setProperty('--picker-top',`${top}px`);
        const anchor=trigger.getBoundingClientRect(),width=Math.min(360,innerWidth-32);
        menu.style.setProperty('--picker-left',`${Math.max(16,Math.min(anchor.left,innerWidth-width-16))}px`);
        menu.style.setProperty('--picker-bottom',`${Math.max(16,innerHeight-anchor.top+12)}px`);
        menu.style.setProperty('--picker-available',`${Math.max(180,anchor.top-top-28)}px`);
    }
    function close(focus=false){menu.close();trigger.setAttribute('aria-expanded','false');if(focus)trigger.focus({preventScroll:true});}
    function filter(){const query=search.value.trim().toLocaleLowerCase();let count=0;for(const [label,button] of choices){button.hidden=!label.toLocaleLowerCase().includes(query);if(!button.hidden)count++;}empty.hidden=count>0;}
    function set(value){selected=value;name.textContent=value;trigger.setAttribute('aria-label',`Collection: ${value}`);for(const [label,button] of choices)button.setAttribute('aria-pressed',String(label===value));}
    for(const [label,works] of collections){
        const button=document.createElement('button');button.type='button';button.className='collection-option';
        const title=document.createElement('span'),count=document.createElement('span');title.textContent=label;count.textContent=works.length;button.append(title,count);
        button.onclick=()=>{close(true);if(label!==selected)onChange(label);};list.append(button);choices.set(label,button);
    }
    trigger.onclick=()=>{
        if(menu.open){close();return;}
        search.value='';filter();fit();
        // Autofocus the close control, never the search field: iOS must not open
        // its keyboard just because the collector wants to browse the list.
        menu.querySelector('.collection-close').autofocus=true;
        menu.showModal();trigger.setAttribute('aria-expanded','true');
        choices.get(selected)?.focus({preventScroll:true});choices.get(selected)?.scrollIntoView({block:'nearest'});
    };
    menu.querySelector('.collection-close').onclick=()=>close(true);
    menu.addEventListener('cancel',event=>{event.preventDefault();close(true);});
    menu.addEventListener('click',event=>{if(event.target===menu){const b=menu.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)close(true);}});
    search.oninput=filter;
    menu.addEventListener('keydown',event=>{
        if(event.key==='ArrowDown'||event.key==='ArrowUp'){
            event.preventDefault();const visible=[...choices.values()].filter(button=>!button.hidden),index=visible.indexOf(document.activeElement),step=event.key==='ArrowDown'?1:-1;
            visible[(index+step+visible.length)%visible.length]?.focus();
        }
    });
    viewport?.addEventListener('resize',fit);viewport?.addEventListener('scroll',fit);
    set(initial);
    return {element:root,set,close,isOpen:()=>menu.open,destroy(){viewport?.removeEventListener('resize',fit);viewport?.removeEventListener('scroll',fit);menu.close();menu.remove();root.remove();}};
}
