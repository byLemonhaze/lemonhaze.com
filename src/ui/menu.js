function setSidebarState({appState,sidebar,mobileBackdrop},open) {
    appState.isMobileMenuOpen=open;
    if(sidebar){
        sidebar.classList[open?'remove':'add']('-translate-x-full');
        sidebar.inert=!open;
        sidebar.setAttribute?.('role',open?'dialog':'navigation');
        if(open)sidebar.setAttribute?.('aria-modal','true');else sidebar.removeAttribute?.('aria-modal');
    }
    const menuButton=sidebar?.ownerDocument.getElementById('menu-toggle');
    menuButton?.setAttribute('aria-expanded',String(open));
    menuButton?.setAttribute('aria-label',open?'Close navigation':'Open navigation');
    if(menuButton)menuButton.textContent=open?'Close':'Menu';
    const backdrop=mobileBackdrop();backdrop?.classList[open?'remove':'add']('hidden');
    if(open){
        const focus=()=>{if(appState.isMobileMenuOpen)sidebar?.querySelector?.('#top-nav-section a')?.focus({preventScroll:true});};
        const view=sidebar?.ownerDocument.defaultView;
        if(view?.requestAnimationFrame)view.requestAnimationFrame(focus);else focus();
    }
    else if(sidebar?.contains?.(sidebar.ownerDocument.activeElement))menuButton?.focus?.({preventScroll:true});
}
export function toggleMobileSidebar(refs){setSidebarState(refs,!refs.appState.isMobileMenuOpen);}
export function closeMobileSidebar(refs){setSidebarState(refs,false);}

export function prepareWebsiteMenu({sidebar,menuButton,closeMenu,isOpen}) {
    if(!sidebar||!menuButton)return;
    // Keep the control outside page headers, which can be hidden or inert while
    // the shared artwork detail is open. Its position stays constant everywhere.
    document.body.append(menuButton);menuButton.textContent='Menu';
    sidebar.setAttribute('aria-label','Website navigation');sidebar.inert=true;
    document.addEventListener('keydown',event=>{
        if(!isOpen())return;
        if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeMenu();menuButton.focus();return;}
        if(event.key!=='Tab')return;
        const links=[menuButton,...sidebar.querySelectorAll('a[href],button:not([disabled]),summary,input')].filter(node=>node.getClientRects().length);
        const index=links.indexOf(document.activeElement);
        event.preventDefault();
        const next=index<0?0:(index+(event.shiftKey?-1:1)+links.length)%links.length;
        links[next]?.focus();
    },true);
    window.addEventListener('lemonhaze:route-change',()=>{if(isOpen())closeMenu();});
    window.addEventListener('popstate',()=>{if(isOpen())closeMenu();});
}
