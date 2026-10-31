import {mockups} from './mockups.js';
import {TEXTILE_PERIOD} from '../../shared/shop-textiles.js';
import { PRODUCTS, OFFERS, offersFor, quantityLimit, SHOP, PAYMENT_METHODS, money, normalizeCart, cartSummary } from './catalog.js';
import './shop.css';
import {checkoutView as secureCheckoutView, orderView, checkoutConfig} from './checkout.js';
// Deliberate build-time opt-in. Payment readiness alone must never open sales.
const storefrontOpen = import.meta.env.VITE_SHOP_STOREFRONT_OPEN === 'true';
const CART_KEY = 'lh-shop-basket-v1';
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paperText = '315 gsm · 100% cotton rag · textured matte';
export function createShop() {
 const prints = PRODUCTS.filter(p=>p.type==='print'), textiles = PRODUCTS.filter(p=>p.type==='textile');
 const featured = prints[0], heroScene = mockups[featured.id].find(m=>m.label==='Architect Desk') || mockups[featured.id][0];
 const root = document.createElement('div'); root.className = 'lh-shop';
 let cart = {}; try { cart = normalizeCart(JSON.parse(localStorage.getItem(CART_KEY))); } catch {}
 let filter = 'all', selectedMethod = 'stripe', opener, toastTimer;
 root.innerHTML = `
  <div class="shop-topline"><span class="shop-eyebrow">Print Shop / Physical artworks</span>${storefrontOpen?'<button class="shop-basket" data-action="basket">Basket <span data-count>0</span> ↗</button>':'<span class="shop-eyebrow">Coming soon</span>'}</div>
  <div class="shop-draft"><span class="shop-dot"></span> ${storefrontOpen?'Explore the works and build your selection.':'Coming soon · Explore the works. Prices on request; online ordering is not open yet.'}</div>
  <div class="shop-hero">
   <div class="shop-intro"><p class="shop-eyebrow">Lemonhaze · Paper & textile</p><h1>From the screen.<br>Into your space.</h1><p>Nine selected forms from <em>Symbiosis</em>. Woven surfaces, fragments of colour, and impossible folds—brought into the physical world on textured cotton paper. Alongside them, nine physical textile works from 2023–2025, each with a certificate of authenticity.</p><div class="shop-hero-actions"><button class="shop-primary" data-action="browse">Explore the works <span>↓</span></button><span>${storefrontOpen?'Signed prints · US$500':'Signed prints · Price on request'}</span></div><p class="shop-small">13 × 23.11 in · 33.02 × 58.70 cm<br>9:16 portrait · Unframed print</p></div>
   <figure class="shop-hero-art"><button data-product="${featured.id}" aria-label="View ${featured.title}"><img src="/shop/${heroScene.file}" alt="${featured.title} framed at an architect’s desk; illustrative room mockup" fetchpriority="high" width="1086" height="1448"></button><figcaption>01 / Symbiosis <span>${featured.series} · Room mockup · Frame not included</span></figcaption></figure>
  </div>
  <div class="shop-facts"><span><b>${String(PRODUCTS.length).padStart(2, '0')}</b> Selected works</span><span><b>315 gsm</b> Cotton rag paper</span><span><b>9:16</b> Portrait format</span><span><b>${storefrontOpen?'Prints $500':'Price on request'}</b> ${storefrontOpen?'Prices in USD':'Ordering coming soon'}</span></div>
  <section class="shop-offer-overview" aria-labelledby="shop-offer-title"><p class="shop-eyebrow">Signed paper prints</p><h2 id="shop-offer-title">Signed. Certified. Limited to three.</h2><div class="shop-offer-comparison">${OFFERS.map(o=>`<article class="${o.available?'':'is-unavailable'}"><h3>${o.name}</h3><strong>${o.available?(storefrontOpen?`US${money(o.priceCents)}`:'Price on request'):'Unavailable'}</strong><p>${o.description}</p></article>`).join('')}</div><p class="shop-small">${storefrontOpen?'US$500 per signed print, taxes and shipping included':'Price on request · Ordering coming soon'} · Physical prints are unframed. On-chain editions are not available for this selection.</p></section>
  <section id="shop-prints" class="shop-collection" aria-labelledby="shop-collection-title"><div class="shop-section-heading"><div><p class="shop-eyebrow">01 / The selection</p><h2 id="shop-collection-title">The print collection.</h2></div><p>Choose a form to look closer.</p></div>
   <div class="shop-filter" aria-label="Filter prints">${[['all','All prints'], ...[...new Set(prints.map(p=>p.series))].map(series=>[series,series])].map(([value,label])=>`<button data-filter="${value}" aria-pressed="${value==='all'}">${label}</button>`).join('')}<span data-results>${prints.length} prints</span></div><div class="shop-grid" data-print-grid></div>
  </section>
  <section class="shop-paper" id="shop-paper"><div><p class="shop-eyebrow">02 / The material</p><h2>A surface with<br>its own character.</h2><p>Palo Duro Etching by Red River Paper gives these intricate forms a physical texture of their own. A substantial cotton paper with a matte surface, chosen to complement the woven detail of the work.</p><a href="${SHOP.paperUrl}" target="_blank" rel="noopener noreferrer" class="shop-text-link">Meet the paper ↗</a></div><dl class="shop-specs"><div><dt>Paper</dt><dd>Palo Duro Etching</dd></div><div><dt>Material & weight</dt><dd>100% cotton rag · 315 gsm</dd></div><div><dt>Surface</dt><dd>Textured matte</dd></div><div><dt>Approximate print size</dt><dd>13 × 23.11 inches<br>33.02 × 58.70 cm</dd></div><div><dt>Composition</dt><dd>9:16 · portrait</dd></div><div><dt>Presentation</dt><dd>Unframed; final border and trim to be confirmed</dd></div></dl></section>
  <section class="shop-room"><figure><img src="/shop/2026-10-29-scenes/artwork-09-chess-corner-white-mat.jpg" alt="Symbiosis 06 in a chess corner, an illustrative framed presentation" loading="lazy" width="1086" height="1448"><figcaption>Illustrative mockup. Framing is not included; size and surroundings are for inspiration.</figcaption></figure><div><p class="shop-eyebrow">03 / A place for the work</p><h2>Live with it.<br>Look again.</h2><p>From across a room, a single silhouette. Up close, a world of interlocking patterns. Each print keeps the full composition, including the annotations within the artwork.</p><button class="shop-text-link" data-product="print1">Take a closer look at 06 ↗</button></div></section>
  <section id="shop-textiles" class="shop-collection shop-textiles" aria-labelledby="shop-textile-title"><div class="shop-section-heading"><div><p class="shop-eyebrow">04 / Original textile works · ${TEXTILE_PERIOD}</p><h2 id="shop-textile-title">Marker on textile.</h2></div><p>Nine physical pieces · ${storefrontOpen?'US$800 each':'Price on request'}<br>Certificate of authenticity included</p></div><p class="shop-textile-intro">Made on the move, in Mexico and across East Asia. These small marker works on denim grew out of a life spent travelling: flexible pieces that could be rolled up and carried from one place to the next. Art for globetrotters, nomads, and anyone who likes to travel light. Each piece has its own shape, texture and dimensions, with one of each available.</p><div class="shop-grid" data-textile-grid></div></section>
  <section class="shop-info"><div><p class="shop-eyebrow">05 / Good to know</p><h2>From studio<br>to doorstep.</h2><p>Nine works on paper and nine textile pieces from 2023–2025. Every work is a physical artwork for your space.</p></div><div class="shop-faq">
   <details open><summary>Shipping & delivery</summary><p>Ships from Montréal. Allow 5 business days for preparation and dispatch, Monday–Friday; transit time depends on destination. ${storefrontOpen?'Signed paper prints are US$500 each with taxes and shipping included. Textile shipping is free within Canada, US$15 to the USA, and US$30 to other supported international destinations, with applicable taxes shown before payment.':'Prices on request. Online ordering is coming soon; delivery arrangements will be confirmed before purchase.'} International customs duties or import charges, if assessed by the destination country, are not included.</p></details>
   <details><summary>What comes with the print?</summary><p>${storefrontOpen?'Every paper print is US$500, including taxes and shipping: a signed, unframed print':'Each paper print is signed and unframed'} on Palo Duro Etching paper, accompanied by a certificate of authenticity. The signed edition is limited to 3 per artwork. On-chain is unavailable for all nine prints; the signed print does not include a token or digital inscription. Frames and room settings are illustrative. Border and final trim details will be confirmed before orders open.</p></details>
   <details><summary>What comes with a textile work?</summary><p>Each textile work ${storefrontOpen?'is US$800 and includes':'includes'} the physical piece shown and a certificate of authenticity. One of each is available. Each product lists its width and height in centimetres. Created while travelling in Mexico and East Asia during 2023–2025. Their small, flexible format makes them easy to carry; some are pocket-sized, but a protective sleeve is a better travelling companion. If rolling, roll loosely without tight folds and protect the marked surface from rubbing. Keep dry and handle gently. Individual creation years are not specified. Framed views show presentation ideas. The textile is sold unframed; frames and mounts shown are not included.</p></details>
   <details><summary>Card, Bitcoin & USDC</summary><p>Card checkout will use Stripe. Bitcoin (BTC) and USDC are planned but are not currently available. On-chain editions are a separate offer and remain unavailable. Online ordering is coming soon.</p></details>
   <details><summary>Care & framing</summary><p>Handle by the edges with clean, dry hands. Keep away from moisture and direct sunlight. Use archival framing materials and allow space between the artwork and glazing.</p></details>
   <details><summary>Returns & delivery issues</summary><p>All sales are final for change-of-mind purchases. This does not limit any mandatory rights for defective, damaged, misdescribed or undelivered goods. Contact shop@lemonhaze.com with your order reference for delivery problems; keep the packaging and photographs of any damage.</p></details>
  </div></section>
  <section class="shop-info"><div><p class="shop-eyebrow">06 / Your privacy</p><h2>Care for your information.</h2></div><div><p>When ordering opens, Stripe will collect payment and delivery details at checkout. The studio uses the information needed to prepare your artwork, arrange delivery and provide support.</p><p>The basket saves artwork selections in your browser. The shop’s order database keeps order references and payment status without duplicating your address or card details.</p><p><a href="/privacy.html">Privacy policy →</a></p><p><a href="/terms.html">Order terms, delivery & returns →</a></p><p>Questions? <a href="mailto:shop@lemonhaze.com">shop@lemonhaze.com</a></p></div></section>
  <footer class="shop-footer"><span>Lemonhaze / Print Shop</span><span>${storefrontOpen?'Card via Stripe <small>BTC & USDC planned</small>':'Price on request <small>Online ordering coming soon</small>'}</span></footer>
  <div class="shop-toast" role="status" aria-live="polite"></div>
  <dialog class="shop-dialog" aria-labelledby="shop-dialog-title"><div class="shop-dialog-head"><span class="shop-eyebrow">Lemonhaze / Shop preview</span><button data-action="close" aria-label="Close shop dialog">Close ×</button></div><div class="shop-dialog-content"></div></dialog>`;
 const dialog = root.querySelector('dialog'), content = root.querySelector('.shop-dialog-content');
 const updateCount = () => { const count=root.querySelector('[data-count]'); if(count)count.textContent=cartSummary(cart).count; };
 const persist = () => { cart = normalizeCart(cart); try { localStorage.setItem(CART_KEY,JSON.stringify(cart)); } catch {} updateCount(); };
 const toast = text => { clearTimeout(toastTimer); const node = root.querySelector('.shop-toast'); node.textContent = text; toastTimer = setTimeout(() => { node.textContent = ''; }, 4500); };
 const show = () => { if (!dialog.open) { opener=document.activeElement; dialog.showModal(); } dialog.scrollTop=0; };
 const close = () => dialog.close();
 dialog.addEventListener('close',()=>{ if(opener?.isConnected)opener.focus(); });
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
 function renderGrid() {
  const products=prints.filter(p=>filter==='all'||p.series===filter);
  root.querySelector('[data-results]').textContent=`${products.length} prints`;
  const cards = list => list.map(p=>`<article class="shop-card" data-type="${p.type}"><button class="shop-card-image" data-product="${p.id}" aria-label="View ${p.title}"><img src="${p.preview}" alt="${p.description}" width="${p.type==='textile'?1122:900}" height="${p.type==='textile'?1402:1600}" loading="lazy"><span>View artwork ↗</span></button><div class="shop-card-meta"><span>${p.number} / ${p.series}</span><span>${p.type==='textile'?p.sizeCm.join(' × ')+' cm':'9:16'}</span></div><h3><button data-product="${p.id}">${p.title}</button></h3><div class="shop-card-bottom"><span>${!storefrontOpen?`Price on request <small>${p.type==='textile'?'Certificate included':'Signed + certificate · Edition of 3'}</small>`:p.type==='textile'?'US$800 <small>Certificate included</small>':'US$500 <small>Signed + certificate · Edition of 3 · Tax & shipping included</small>'}</span><button data-product="${p.id}" aria-label="View details for ${p.title}">View artwork ↗</button></div></article>`).join('');
  root.querySelector('[data-print-grid]').innerHTML=cards(products);
  root.querySelector('[data-textile-grid]').innerHTML=cards(textiles);
 }
 function productView(id) {
  const p=PRODUCTS.find(p=>p.id===id); if(!p)return;
  const offers=offersFor(p), first=offers.find(o=>o.available), textile=p.type==='textile';
  content.innerHTML=`<div class="shop-product"><div><div class="shop-product-image"><img data-main-image src="${p.preview}" alt="${p.description}" width="900" height="1600"></div><div class="shop-image-controls"><button data-image="${p.preview}" data-alt="${p.description}" aria-pressed="true">Artwork</button>${(mockups[p.id]||[]).map(m=>`<button data-image="/shop/${m.file}" data-alt="${p.title} in ${m.label.toLowerCase()}; illustrative mockup, frame not included" aria-pressed="false">${m.label}</button>`).join('')}<a href="${p.original}" target="_blank" rel="noopener noreferrer">Full resolution ↗</a></div><p class="shop-small" data-image-caption>${textile?'Physical textile artwork':'Full composition · 9:16 portrait'}</p></div><div class="shop-product-copy"><p class="shop-eyebrow">${textile?'Textile':'Print'} ${p.number} / ${p.series}</p><h2 id="shop-dialog-title">${p.title}</h2><p>${p.description}</p>${p.dated?`<p class="shop-small">Artwork inscription: ${esc(p.attribution)}<br>${esc(p.dated)}<br>${esc(p.location)}</p>`:''}${storefrontOpen?`<fieldset class="shop-offers"><legend>Choose your offer</legend>${offers.map(o=>`<label class="${o.available?'':'is-unavailable'}"><input type="radio" name="offer" value="${o.id}" ${o.id===first.id?'checked':''} ${o.available?'':'disabled'}><span><b>${o.name}</b><small>${o.description}</small></span><strong>${o.available?(storefrontOpen?`US${money(o.priceCents)}`:'Price on request'):'Unavailable'}</strong></label>`).join('')}</fieldset><p class="shop-price" data-offer-price aria-live="polite">US${money(first.priceCents)} <small>${first.name} · USD</small></p>`:`<p class="shop-price">Price on request</p><p>${first.name} · ${textile?'One original artwork':'Limited edition of 3 per artwork'}</p>`}${textile?`<p class="shop-small">Textile works · ${TEXTILE_PERIOD}</p>`:''}<dl class="shop-specs"><div><dt>Size</dt><dd>${textile?p.sizeCm.join(' × ')+' cm<br>Width × height':'13 × 23.11 in<br>33.02 × 58.70 cm'}</dd></div><div><dt>${textile?'Includes':'Paper'}</dt><dd>${textile?'Physical textile artwork<br>Certificate of authenticity':`Palo Duro Etching<br>${paperText}`}</dd></div><div><dt>${textile?'Availability':'Finish'}</dt><dd>${textile?'One available':'Unframed · 9:16 portrait'}</dd></div></dl>${storefrontOpen?`<label class="shop-quantity-label">Quantity <input type="number" min="1" max="${quantityLimit(first)}" value="1" step="1" data-product-quantity></label><button class="shop-primary" data-add-detail="${p.id}">Add to basket <span>+</span></button><p class="shop-small">${textile?'Textile shipping: Canada free · USA US$15 · International US$30. Applicable taxes shown before payment.':'US$500 total per print · Taxes and shipping included.'} Preparation and dispatch within 5 business days, Monday–Friday.</p><button class="shop-text-link" data-action="basket">View basket →</button>`:`<button class="shop-primary" disabled>Coming Soon</button><p class="shop-small">Online ordering is not open yet. For pricing enquiries, contact <a href="mailto:shop@lemonhaze.com">shop@lemonhaze.com</a>.</p><p class="shop-small">Preparation and dispatch within 5 business days, Monday–Friday, once orders open.</p>`}</div></div>`;
  content.querySelector('.shop-offers')?.addEventListener('change', event => {
   const offer=offers.find(o=>o.id===event.target.value && o.available);
   if(offer){
    content.querySelector('[data-offer-price]').innerHTML=`US${money(offer.priceCents)} <small>${offer.name} · USD</small>`;
    const quantity=content.querySelector('[data-product-quantity]');
    quantity.max=String(quantityLimit(offer));
    if(Number(quantity.value)>Number(quantity.max))quantity.value=quantity.max;
   }
  });
  show();
 }
 function add(id,quantity=1,offerId='signed') {
  if(!storefrontOpen)return;
  if(!PRODUCTS.some(p=>p.id===id)||!Number.isSafeInteger(quantity)||quantity<1||quantity>10)return;
  const offer=offersFor(PRODUCTS.find(p=>p.id===id)).find(o=>o.id===offerId&&o.available);if(!offer)return;
  const key=`${id}:${offer.id}`;cart[key]=Math.min(quantityLimit(offer),(cart[key]||0)+quantity); persist(); toast(`${PRODUCTS.find(p=>p.id===id).title} added. Basket: ${cartSummary(cart).count} items.`);
 }
 function basketView() {
  if(!storefrontOpen)return;
  const summary=cartSummary(cart);
  content.innerHTML=`<div class="shop-checkout-shell"><p class="shop-eyebrow">Your selection</p><h2 id="shop-dialog-title">Basket <span>(${summary.count})</span></h2>${summary.count?`<div class="shop-cart-items">${summary.items.map(p=>`<div class="shop-cart-row"><img src="${p.preview}" alt="${p.title}" width="72" height="128"><div><h3>${p.title}</h3><p class="shop-small">${p.offerName}${p.editionLimit?` · Edition of ${p.editionLimit} per artwork`:''}<br>${p.type==='textile'?p.sizeCm.join(' × ')+' cm · Certificate included':'13 × 23.11 in · Unframed'}</p><div class="shop-quantity"><button data-qty="${p.key}" data-delta="-1" aria-label="Decrease ${p.title} ${p.offerName} quantity">−</button><span aria-live="polite">${p.quantity}</span><button data-qty="${p.key}" data-delta="1" aria-label="Increase ${p.title} ${p.offerName} quantity" ${p.quantity>=p.maxQuantity?'disabled':''}>+</button><button data-remove="${p.key}">Remove</button></div></div><strong>${money(p.priceCents*p.quantity)}</strong></div>`).join('')}</div><div class="shop-totals"><div><span>Artwork subtotal · USD</span><strong>${money(summary.subtotal)}</strong></div><div><span>Shipping</span><span>${summary.items.every(p=>p.type==='print')?'Included':'Textiles: calculated by destination'}</span></div><div><span>Taxes</span><span>${summary.items.every(p=>p.type==='print')?'Included':'Print taxes included; textile taxes at checkout'}</span></div></div><p class="shop-small">Prices in USD. Artworks are reserved only when secure checkout opens. A saved basket is not a reservation.</p><button class="shop-primary" data-action="checkout">Continue to checkout <span>→</span></button><button class="shop-text-link" data-action="close">Continue exploring</button>`:`<p>Your basket is waiting for an artwork.</p><button class="shop-primary" data-action="close">Explore the selection →</button>`}</div>`;
  show();
 }
 function checkoutView() {
  if(!storefrontOpen)return;
  const summary=cartSummary(cart);if(!summary.count){basketView();return;}
  secureCheckoutView({content,show,summary,onBasket:basketView,onOrder:id=>orderView({id,content,show,onBasket:basketView})});
 }
 root.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.product){productView(button.dataset.product);return;}
  if(button.dataset.add){add(button.dataset.add);return;}
  if(button.dataset.addDetail){if(!storefrontOpen)return;const input=content.querySelector('[data-product-quantity]');if(!input.reportValidity())return;add(button.dataset.addDetail,Number(input.value),content.querySelector('input[name=offer]:checked')?.value);basketView();return;}
  if(button.dataset.filter){filter=button.dataset.filter;root.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderGrid();return;}
  if(button.dataset.image){const img=content.querySelector('[data-main-image]');img.src=button.dataset.image;img.alt=button.dataset.alt;content.querySelectorAll('[data-image]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));content.querySelector('[data-image-caption]').textContent=button.textContent==='Artwork'?'Full artwork':'Illustrative mockup · Frame not included · Approximate scale';return;}
  if(button.dataset.qty){const id=button.dataset.qty,delta=Number(button.dataset.delta);cart[id]=Math.max(0,Math.min(10,(cart[id]||0)+delta));persist();basketView();content.querySelector(`[data-qty="${id}"][data-delta="${delta}"]`)?.focus();return;}
  if(button.dataset.remove){delete cart[button.dataset.remove];persist();basketView();content.querySelector('button')?.focus();return;}
  switch(button.dataset.action){
   case 'browse':root.querySelector('#shop-prints').scrollIntoView({behavior:'smooth'});break;
   case 'basket':basketView();break;
   case 'close':close();break;
   case 'checkout':checkoutView();break;
   case 'download':{
    if(!storefrontOpen)return;
    const summary=cartSummary(cart);const text=`LEMONHAZE / SAVED SELECTION\nPreview only. Not an order or reservation.\n\n${summary.items.map(p=>`${p.quantity} x ${p.title} / ${p.offerName} — ${money(p.quantity*p.priceCents)} USD`).join('\n')}\n\nArtwork subtotal: ${money(summary.subtotal)} USD\n13 x 23.11 in / 33.02 x 58.70 cm / 9:16\nPalo Duro Etching, 315 gsm, 100% cotton rag\nUnframed. Shipping and taxes to be confirmed.\nPayment preference: ${selectedMethod}\nNo payment taken.\n`;
    const url=URL.createObjectURL(new Blob([text],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download='lemonhaze-print-selection.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);break;
   }
  }
 });
 renderGrid();persist();
 if(storefrontOpen)checkoutConfig().then(config=>{if(config.available)root.querySelector('.shop-draft').textContent=config.mode==='test'?'Stripe test checkout · No real payment or shipment.':'Physical artworks · Secure card checkout with Stripe.';});
 const returnId=new URLSearchParams(window.location.search).get('order');
 if(returnId&&/^[a-f0-9-]{36}$/.test(returnId))queueMicrotask(()=>orderView({id:returnId,content,show,onBasket:basketView}));
 return root;
}
