import {money} from './catalog.js';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function shopRequest(path,body) {
  let response,data;
  try{
    response=await fetch(`/api/shop/${path}`,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
    data=await response.json();
  }catch{throw new Error('Secure checkout is not connected yet. Your basket is saved; no payment has been taken.');}
  if(!response.ok){const error=new Error(data.error||'Checkout is unavailable. Please try again.');error.orderId=data.orderId;throw error;}
  return data;
}
export async function checkoutConfig(){try{return await shopRequest('config');}catch{return {available:false};}}

let challengeScript;
function loadChallenge(){
  if(window.turnstile)return Promise.resolve();
  if(!challengeScript)challengeScript=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
    script.onload=resolve;script.onerror=()=>{challengeScript=null;script.remove();reject(new Error('The security check could not load. Please try again.'));};document.head.append(script);
  });
  return challengeScript;
}
export async function checkoutView({content,show,summary,onBasket,onOrder}) {
  content.innerHTML='<div class="shop-checkout-shell"><h2 id="shop-dialog-title">Preparing secure checkout…</h2><p role="status">Checking availability.</p></div>';show();
  const loading=content.firstElementChild;
  const config=await checkoutConfig();if(!loading.isConnected)return;
  const printsOnly=summary.items.every(i=>i.type==='print');
  content.innerHTML=`<div class="shop-checkout-shell"><button class="shop-text-link" data-back>← Back to basket</button><p class="shop-eyebrow">${config.available?(config.mode==='test'?'Stripe / Test checkout':'Stripe / Secure checkout'):'Checkout / Opening soon'}</p><h2 id="shop-dialog-title">${config.available?'Delivery & payment.':'Your selection is saved.'}</h2>
    <p>${config.available?'Enter your delivery address and payment details on Stripe’s secure checkout.':'Checkout will open once shipping and payment setup are complete. No payment or personal delivery details are collected yet.'}</p>
    <div class="shop-totals"><div><span>Artwork subtotal · USD</span><strong>${money(summary.subtotal)}</strong></div><div><span>Shipping</span><span data-shipping>${printsOnly?'Included':config.available?'Choose a delivery country':'Canada free · USA US$15 · International US$30'}</span></div><div><span>Tax</span><span>${printsOnly?'Included':'Print taxes included; textile taxes shown before payment'}</span></div></div>
    ${config.available?`<form class="shop-checkout-form"><label>Deliver to<select name="country" required><option value="">Choose a country</option>${config.countries.map(c=>`<option value="${esc(c)}">${esc(new Intl.DisplayNames(['en'],{type:'region'}).of(c))}</option>`).join('')}</select></label><p class="shop-small" data-phone>Delivery contact details are collected by Stripe.</p><p>${esc(config.shipping.label)} · ${esc(config.shipping.dispatch)}</p>${config.mode==='test'?'<p class="shop-draft">Test mode: use test details only. No real payment or shipment.</p>':''}<div data-challenge></div><button class="shop-primary" type="submit">${config.mode==='test'?'Open Stripe test checkout':'Continue to Stripe'} →</button></form>`:''}
    <p class="shop-small"><a href="/terms.html" target="_blank" rel="noopener">Order terms, delivery & returns (new tab)</a> · <a href="/privacy.html" target="_blank" rel="noopener">Privacy policy (new tab)</a></p>
    <p class="shop-small">Card via Stripe. Bitcoin and USDC are not available yet.</p>
    <details class="shop-checkout-privacy" open><summary>Your information</summary><p>Card details, name, email, and delivery address are collected by Stripe. The shop’s order database keeps the print selection, order reference, and payment status—not a copy of your address or card details. The studio accesses delivery details through Stripe to fulfil your order and shares the necessary details with the shipping carrier.</p><p>Only print IDs and quantities are saved in this browser’s basket. Delivery details are not saved in browser storage. A necessary, protected cookie links your checkout to this browser.</p></details>
    ${config.contact?`<p class="shop-small">Order support: ${esc(config.contact)}</p>`:''}${config.returns?`<details><summary>Returns & delivery issues</summary><p>${esc(config.returns)}</p></details>`:''}
    <p role="status" aria-live="polite" data-status></p><div data-recovery></div></div>`;
  content.querySelector('[data-back]').onclick=onBasket;
  if(!config.available)return;
  const form=content.querySelector('form'),status=content.querySelector('[data-status]'),button=form.querySelector('button[type=submit]');
  let token='',widget;
  const country=form.querySelector('select');
  country.onchange=()=>{const amount=printsOnly?0:config.shipping.rates[country.value];content.querySelector('[data-shipping]').textContent=country.value?(amount===0?(printsOnly?'Included':'Free'):`${money(amount)} USD`):'Choose a delivery country';content.querySelector('[data-phone]').textContent=country.value==='CA'&&!config.phone?'No phone number is requested for this delivery option. Tracking can use email.':'A phone number is required for this delivery option, for delivery or customs contact only.';};
  if(config.turnstileSiteKey){
    button.disabled=true;
    try{await loadChallenge();if(!form.isConnected)return;widget=window.turnstile.render(form.querySelector('[data-challenge]'),{sitekey:config.turnstileSiteKey,action:'shop-checkout',callback:value=>{token=value;button.disabled=false;},'expired-callback':()=>{token='';button.disabled=true;},'error-callback':()=>{token='';button.disabled=true;status.textContent='Please reload the security check.';}});}catch(error){status.textContent=error.message;return;}
  }
  form.onsubmit=async event=>{
    event.preventDefault();button.disabled=true;status.textContent='Reserving your prints and opening Stripe…';
    try{
      const result=await shopRequest('checkout',{items:summary.items.map(i=>({productId:i.id,offerId:i.offerId,quantity:i.quantity})),country:country.value,turnstileToken:token});
      if(result.status){onOrder(result.orderId);return;}
      const url=new URL(result.url);if(url.protocol!=='https:'||url.hostname!=='checkout.stripe.com')throw new Error('Unexpected checkout destination. Please contact the studio.');
      window.location.assign(url.href);
    }catch(error){
      status.textContent=error.message;
      if(error.orderId){
        const recovery=content.querySelector('[data-recovery]');recovery.replaceChildren();
        const cancel=document.createElement('button');cancel.className='shop-text-link';cancel.textContent='Cancel earlier checkout';recovery.append(cancel);
        cancel.onclick=async()=>{cancel.disabled=true;try{const order=await shopRequest('cancel',{orderId:error.orderId});if(order.status==='paid')onOrder(order.id);else{status.textContent='Earlier checkout cancelled. You can continue with this selection.';recovery.replaceChildren();}}catch(e){status.textContent=e.message;cancel.disabled=false;}};
      }
      if(widget!==undefined){token='';window.turnstile.reset(widget);}else button.disabled=false;
    }
  };
}

export async function orderView({id,content,show,onBasket}) {
  content.innerHTML='<div class="shop-checkout-shell"><h2 id="shop-dialog-title">Checking your order…</h2><p role="status">Verifying payment with Stripe.</p></div>';show();
  const loading=content.firstElementChild;
  try{
    const order=await shopRequest(`order?id=${encodeURIComponent(id)}`);if(!loading.isConnected)return;
    const paid=order.status==='paid',open=['creating','open'].includes(order.status);
    content.innerHTML=`<div class="shop-checkout-shell"><p class="shop-eyebrow">${order.mode==='test'?'Test order · No real shipment':'Order status'}</p><h2 id="shop-dialog-title">${paid?'Payment confirmed.':order.status==='processing'?'Payment is processing.':open?'Checkout is still open.':'Checkout has expired.'}</h2><p>${paid?'Stripe has confirmed your payment. Keep your receipt and order reference.':open?'Returning here does not cancel a payment or release your reserved prints. You can resume from your basket or cancel below.':'No new payment is being requested here. If a payment is processing, check again shortly.'}</p><p>Reference: <strong>${esc(order.id)}</strong></p>${paid?`<p>Total paid: ${money(order.total)} USD</p>`:''}<button class="shop-primary" data-refresh>Check status again</button>${open?'<button class="shop-text-link" data-cancel>Cancel this checkout</button>':''}<button class="shop-text-link" data-basket>Return to basket →</button><p role="status" data-status></p></div>`;
    content.querySelector('[data-refresh]').onclick=()=>orderView({id,content,show,onBasket});
    content.querySelector('[data-basket]').onclick=onBasket;
    const cancel=content.querySelector('[data-cancel]');if(cancel)cancel.onclick=async()=>{cancel.disabled=true;try{await shopRequest('cancel',{orderId:id});await orderView({id,content,show,onBasket});}catch(error){content.querySelector('[data-status]').textContent=error.message;cancel.disabled=false;}};
  }catch(error){if(!loading.isConnected)return;loading.innerHTML=`<h2 id="shop-dialog-title">Order status unavailable.</h2><p>${esc(error.message)}</p><p>If Stripe sent a receipt, keep it and contact the studio. Do not pay again until your order is checked.</p><button class="shop-text-link" data-basket>Return to basket →</button>`;content.querySelector('[data-basket]').onclick=onBasket;}
}
