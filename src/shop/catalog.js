import {ARTWORKS} from '../../shared/shop-artworks.js';
import {TEXTILES} from '../../shared/shop-textiles.js';
export const SHOP = Object.freeze({
  mode: 'preview', currency: 'USD', priceCents: 50000,
  sizeInches: [13, 23.11], sizeCm: [33.02, 58.70], aspectRatio: '9:16',
  paper: 'Palo Duro Etching',
  paperUrl: 'https://www.redrivercatalog.com/browse/palo-duro-etching.html',
});
export const OFFERS = Object.freeze([
  { id: 'signed', name: 'Signed + Certificate', priceCents: 50000, available: true, editionLimit: 3, description: 'Limited edition of 3 per artwork. A signed physical print, accompanied by a certificate of authenticity. Taxes and shipping included.' },
  { id: 'onchain', name: 'On-chain', priceCents: null, available: false, description: 'Unavailable for all nine prints.' },
]);
const TEXTILE_OFFERS = Object.freeze([
  {id: 'signed', name: 'Textile + Certificate', priceCents: 80000, available: true, stockLimit: 1, description: 'The physical textile artwork shown, accompanied by a certificate of authenticity. One available.'},
]);
export const PRODUCTS = [
 ...ARTWORKS.map(p=>({...p, type:'print', priceCents:50000})),
 ...TEXTILES.map(p=>({...p, type:'textile', priceCents:80000})),
];
export const offersFor = product => product.type === 'textile' ? TEXTILE_OFFERS : OFFERS;
export const quantityLimit = offer => offer.stockLimit ?? offer.editionLimit ?? 10;
export const PAYMENT_METHODS = [
  { id: 'stripe', name: 'Card', detail: 'Visa, Mastercard & more · via Stripe', note: 'Secure card checkout will open here when ordering launches.' },
  { id: 'btc', name: 'Bitcoin', detail: 'BTC · network to be confirmed at checkout', note: 'A time-limited Bitcoin invoice will show the exact BTC amount, network and payment address before you send.' },
  { id: 'usdc', name: 'USDC', detail: 'US dollar stablecoin · supported network shown at checkout', note: 'Your invoice will specify the supported USDC network, token and amount. Network selection will be confirmed before payment.' },
];
export const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
export function normalizeCart(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const safe = {};
  for (const product of PRODUCTS) {
    for (const offer of offersFor(product).filter(o => o.available)) {
      const key = `${product.id}:${offer.id}`;
      // Discard withdrawn unsigned selections; never upgrade a basket to a higher price.
      const quantity = value[key];
      if (Number.isSafeInteger(quantity) && quantity > 0) safe[key] = Math.min(quantityLimit(offer), quantity);
    }
  }
  return safe;
}
export function cartSummary(cart) {
  const safe = normalizeCart(cart);
  const items = PRODUCTS.flatMap(p => offersFor(p).filter(o => o.available && safe[`${p.id}:${o.id}`]).map(o => ({
    ...p, key: `${p.id}:${o.id}`, offerId: o.id, offerName: o.name, editionLimit: o.editionLimit, maxQuantity: quantityLimit(o),
    priceCents: o.priceCents, quantity: safe[`${p.id}:${o.id}`],
  })));
  return { items, count: items.reduce((n, p) => n + p.quantity, 0), subtotal: items.reduce((n, p) => n + p.quantity * p.priceCents, 0) };
}
// No payment provider is invoked by a preview. A live server must calculate totals
// from product IDs, verify payment webhooks and persist orders before fulfilment.
export function prepareCheckout(cart, method) {
  if (!PAYMENT_METHODS.some(p => p.id === method)) throw new Error('Choose a supported payment method.');
  const summary = cartSummary(cart);
  if (!summary.count) throw new Error('Your basket is empty.');
  return { mode: SHOP.mode, currency: SHOP.currency, method, items: summary.items.map(p => ({ productId: p.id, offerId: p.offerId, quantity: p.quantity })), subtotalCents: summary.subtotal, shippingCents: null, taxCents: null, payable: false };
}
