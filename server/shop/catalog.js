// Server-owned catalogue. Never accept prices, descriptions or inventory from a browser.
import {ARTWORKS} from '../../shared/shop-artworks.js';
import {TEXTILES} from '../../shared/shop-textiles.js';
export const CATALOG = Object.freeze(Object.fromEntries([
 ...ARTWORKS.map(p=>[p.id,Object.freeze({name:p.title,type:'print',signed:50000,limit:3})]),
 ...TEXTILES.map(p=>[p.id,Object.freeze({name:p.title,type:'textile',sizeCm:p.sizeCm,signed:80000,limit:1})]),
]));
export class ShopError extends Error {
  constructor(message,status=400){super(message);this.status=status;}
}
export function validateCart(items) {
  if(!Array.isArray(items)||items.length<1||items.length>ARTWORKS.length+TEXTILES.length)throw new ShopError('Choose valid artwork options from the current selection.');
  const seen=new Set();
  const cart=items.map(item=>{
    if(!item || typeof item!=='object' || Array.isArray(item) || Object.keys(item).some(k=>!['productId','offerId','quantity'].includes(k)))throw new ShopError('Invalid artwork selection.');
    const {productId,offerId,quantity}=item;
    if(typeof productId!=='string'||!Object.hasOwn(CATALOG,productId) || offerId!=='signed' || !Object.hasOwn(CATALOG[productId],offerId))throw new ShopError('This artwork or offer is unavailable.');
    if(!Number.isSafeInteger(quantity)||quantity<1||quantity>CATALOG[productId].limit)throw new ShopError('Please check the quantity selected.');
    const key=`${productId}:${offerId}`;if(seen.has(key))throw new ShopError('Duplicate artwork option.');seen.add(key);
    return {productId,offerId,quantity};
  }).sort((a,b)=>`${a.productId}:${a.offerId}`.localeCompare(`${b.productId}:${b.offerId}`));
  return {cart,subtotal:cart.reduce((sum,i)=>sum+CATALOG[i.productId][i.offerId]*i.quantity,0)};
}
