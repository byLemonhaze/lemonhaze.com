export const collectionEntry = (name,items) => name==='Selected works'?0:Math.floor((items.length-1)/2);

export function createCollectionPicker(collections,initial,onChange) {
    const root=document.createElement('div');root.className='room-collection';
    root.innerHTML='<button class="collection-trigger" type="button" aria-haspopup="dialog" aria-expanded="false"><span class="collection-name"></span><span class="collection-chevron" aria-hidden="true"></span></button><section class="collection-menu" role="dialog" aria-label="Choose a collection" hidden><label>Collections<input type="search" aria-label="Find a collection" placeholder="Find a collection" autocomplete="off"></label><div class="collection-options"></div><p class="collection-empty" hidden>No matching collections</p></section>';
    const trigger=root.querySelector('button'),name=root.querySelector('.collection-name'),menu=root.querySelector('section'),search=root.querySelector('input'),list=root.querySelector('.collection-options'),empty=root.querySelector('.collection-empty');
    const choices=new Map();let selected=initial;
    function close(focus=false){menu.hidden=true;trigger.setAttribute('aria-expanded','false');if(focus)trigger.focus();}
    function filter(){const query=search.value.trim().toLocaleLowerCase();let count=0;for(const [label,button] of choices){button.hidden=!label.toLocaleLowerCase().includes(query);if(!button.hidden)count++;}empty.hidden=count>0;}
    function set(value){selected=value;name.textContent=value;trigger.setAttribute('aria-label',`Collection: ${value}`);for(const [label,button] of choices)button.setAttribute('aria-pressed',String(label===value));}
    for(const [label,works] of collections){
        const button=document.createElement('button');button.type='button';button.className='collection-option';
        const title=document.createElement('span'),count=document.createElement('span');title.textContent=label;count.textContent=works.length;button.append(title,count);
        button.onclick=()=>{close(true);if(label!==selected)onChange(label);};list.append(button);choices.set(label,button);
    }
    trigger.onclick=()=>{if(!menu.hidden){close();return;}menu.hidden=false;trigger.setAttribute('aria-expanded','true');search.value='';filter();search.focus();};
    search.oninput=filter;
    menu.addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);}
        if(event.key==='ArrowDown'||event.key==='ArrowUp'){
            event.preventDefault();const visible=[...choices.values()].filter(button=>!button.hidden),index=visible.indexOf(document.activeElement),step=event.key==='ArrowDown'?1:-1;
            visible[(index+step+visible.length)%visible.length]?.focus();
        }
    });
    const outside=event=>{if(!root.contains(event.target))close();};document.addEventListener('pointerdown',outside);
    set(initial);
    return {element:root,set,close,destroy(){document.removeEventListener('pointerdown',outside);root.remove();}};
}
