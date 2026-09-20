import React, {createContext,useContext,useEffect,useId,useRef} from 'react';
type Props=React.HTMLAttributes<HTMLElement>&{children?:React.ReactNode;className?:string};
export function Button({variant,...props}:React.ButtonHTMLAttributes<HTMLButtonElement>&{variant?:string}){return <button type="button" {...props} className={`ui-button ${variant||''} ${props.className||''}`}/>}
export function Input(props:React.InputHTMLAttributes<HTMLInputElement>){return <input {...props}/>}
const TabsContext=createContext({value:'',onValueChange:(_v:string)=>{}});
export function Tabs({value,onValueChange,children}:{value:string;onValueChange:(v:string)=>void;children:React.ReactNode}){return <TabsContext.Provider value={{value,onValueChange}}><div>{children}</div></TabsContext.Provider>}
export function TabsList({children}:{children:React.ReactNode;variant?:string}){return <div className="tabs-list" role="tablist" aria-label="Market views">{children}</div>}
export function TabsTrigger({value,children}:{value:string;children:React.ReactNode}){const ctx=useContext(TabsContext);return <button role="tab" aria-selected={ctx.value===value} aria-controls={`panel-${value}`} id={`tab-${value}`} data-slot="tabs-trigger" data-state={ctx.value===value?'active':'inactive'} onClick={()=>ctx.onValueChange(value)} onKeyDown={e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const tabs=[...e.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>('[role=tab]')];const i=tabs.indexOf(e.currentTarget);const target=tabs[(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length];target.focus();target.click();}}>{children}</button>}
export function TabsContent({value,children}:{value:string;children:React.ReactNode}){const ctx=useContext(TabsContext);return ctx.value===value?<section role="tabpanel" id={`panel-${value}`} aria-labelledby={`tab-${value}`}>{children}</section>:null}
export function Table({children}:Props){return <div className="table-scroll" tabIndex={0} role="region" aria-label="Marketplace table"><table role="table">{children}</table></div>}
export const TableHeader=({children}:Props)=><thead role="rowgroup">{children}</thead>;
export const TableBody=({children}:Props)=><tbody role="rowgroup">{children}</tbody>;
export const TableRow=({children}:Props)=><tr role="row">{children}</tr>;
export const TableHead=({children}:Props)=><th role="columnheader" scope="col">{children}</th>;
export const TableCell=({children,className,label}:Props&{label?:string})=><td role="cell" className={className}>{label&&<span className="mobile-cell-label" aria-hidden="true">{label}</span>}{children}</td>;
const SheetContext=createContext({title:'',description:''});
export function Sheet({open,onOpenChange,children}:{open:boolean;onOpenChange:(v:boolean)=>void;children:React.ReactNode}){const ref=useRef<HTMLDialogElement>(null);const id=useId();useEffect(()=>{const d=ref.current;if(open&&!d?.open)d?.showModal();else if(!open&&d?.open)d.close();},[open]);return <SheetContext.Provider value={{title:id+'title',description:id+'description'}}><dialog ref={ref} className="sheet-dialog" aria-labelledby={id+'title'} aria-describedby={id+'description'} onCancel={()=>onOpenChange(false)} onClick={e=>{if(e.target===e.currentTarget)onOpenChange(false)}}><button className="sheet-close" aria-label="Close panel" onClick={()=>onOpenChange(false)}>×</button>{children}</dialog></SheetContext.Provider>}
export const SheetContent=({children,className}:Props)=><div className={className}>{children}</div>;
export const SheetHeader=({children}:Props)=><div data-slot="sheet-header">{children}</div>;
export function SheetTitle({children}:Props){const ctx=useContext(SheetContext);return <h2 id={ctx.title} data-slot="sheet-title">{children}</h2>}
export function SheetDescription({children}:Props){const ctx=useContext(SheetContext);return <p id={ctx.description} data-slot="sheet-description">{children}</p>}
const icon=(path:React.ReactNode)=>function Icon({size=16,...p}:React.SVGAttributes<SVGSVGElement>&{size?:number}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" {...p}>{path}</svg>};
export const ArrowUpRight=icon(<path d="M6 18 18 6M6 6h12v12"/>);
export const ChevronRight=icon(<path d="m9 5 7 7-7 7"/>);
export const RefreshCw=icon(<><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 6a8 8 0 0 1 14 6M18 18a8 8 0 0 1-14-6"/></>);
export const Search=icon(<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>);
export const Info=icon(<><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/></>);
export const Fingerprint=icon(<><path d="M5 12a7 7 0 0 1 14 0M8 13a4 4 0 1 1 8 0v5M12 11v10M5 15v4m3-3v5m11-6v3"/></>);
export const ScanLine=icon(<path d="M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5M3 12h18"/>);
export const Copy=icon(<><rect x="8" y="8" width="12" height="12"/><path d="M16 8V4H4v12h4"/></>);
export const Check=icon(<path d="m4 12 5 5L20 6"/>);
