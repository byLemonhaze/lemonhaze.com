import {ShopError} from './catalog.js';
export function shippingAmount(shipping,country) {
  if(!shipping.countries.includes(country))throw new ShopError('Choose a supported shipping destination.');
  return shipping.rates?.[country] ?? shipping.amount;
}
export function settings(env) {
  const mode=env.SHOP_MODE==='live'?'live':'test';
  const origin=new URL(env.SHOP_ORIGIN || 'http://127.0.0.1:5173');
  const local=['127.0.0.1','localhost'].includes(origin.hostname);
  if(origin.pathname!=='/'||origin.search||origin.hash||origin.username||origin.password||(!local&&origin.protocol!=='https:'))throw new ShopError('Checkout configuration is incomplete.',503);
  let shipping;
  try{shipping=JSON.parse(env.SHOP_SHIPPING_JSON || (mode==='test'?'{"countries":["CA","US"],"amount":0,"label":"Test shipping — not a real delivery quote","dispatch":"Test checkout only"}':'null'));}catch{throw new ShopError('Shipping is not configured.',503);}
  if(!shipping || !Array.isArray(shipping.countries)||!shipping.countries.length || shipping.countries.some(c=>! /^[A-Z]{2}$/.test(c)) || typeof shipping.label!=='string'||!shipping.label.trim()||typeof shipping.dispatch!=='string'||!shipping.dispatch.trim())throw new ShopError('Shipping is not configured.',503);
  const validAmount=n=>Number.isSafeInteger(n)&&n>=0&&n<=100000;
  if(shipping.rates!==undefined) {
    if(!shipping.rates||typeof shipping.rates!=='object'||Array.isArray(shipping.rates)||shipping.countries.some(c=>!Object.hasOwn(shipping.rates,c)||!validAmount(shipping.rates[c])))throw new ShopError('Shipping is not configured.',503);
  } else if(!validAmount(shipping.amount))throw new ShopError('Shipping is not configured.',503);
  const tax=env.SHOP_TAX_MODE || (mode==='test'?'none':'');
  if(!['none','automatic'].includes(tax))throw new ShopError('Tax settings are not configured.',503);
  const key=env.STRIPE_SECRET_KEY || '';
  if(!new RegExp(`^(sk|rk)_${mode}_`).test(key)||!env.SHOP_DB)throw new ShopError('Secure checkout is being connected. Please try again later.',503);
  if(!env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_'))throw new ShopError('Payment confirmation is not configured.',503);
  if(!env.SHOP_RATE_SECRET || env.SHOP_RATE_SECRET.length<32)throw new ShopError('Checkout protection is not configured.',503);
  if(mode==='live' && (tax!=='automatic'||local||env.SHOP_LIVE_ENABLED!=='true'||env.SHOP_POLICIES_CONFIRMED!=='true'||!env.SHOP_CONTACT_EMAIL||!env.SHOP_RETURNS_TEXT))throw new ShopError('Ordering has not opened yet.',503);
  if(!local && (!env.TURNSTILE_SECRET_KEY||!env.TURNSTILE_SITE_KEY))throw new ShopError('Checkout protection is not configured.',503);
  return {mode,origin:origin.origin,local,shipping,tax,phone:env.SHOP_COLLECT_PHONE==='true',turnstileSiteKey:local?null:env.TURNSTILE_SITE_KEY};
}
