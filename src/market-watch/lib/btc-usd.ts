export const BTC_USD_URL = 'https://api.coinbase.com/v2/prices/BTC-USD/spot';
export const RATE_REFRESH_MS = 60_000;
export const RATE_MAX_AGE_MS = 90_000;
export type BtcUsdQuote = { usd: number; checkedAt: number };
const dollars = new Intl.NumberFormat('en-US', {style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2});

export async function fetchBtcUsdQuote(signal: AbortSignal): Promise<BtcUsdQuote> {
    const response = await fetch(BTC_USD_URL, {cache:'no-store',signal});
    if (!response.ok) throw new Error('BTC/USD unavailable');
    const {data} = await response.json();
    const usd = Number(data?.amount);
    if (data?.currency !== 'USD' || (data?.base && data.base !== 'BTC') || !Number.isFinite(usd) || usd <= 0) throw new Error('Invalid BTC/USD rate');
    return {usd,checkedAt:Date.now()};
}

export function usdFromSats(sats: number|null|undefined, quote: BtcUsdQuote|null, now=Date.now()): string|null {
    if (sats == null || !Number.isFinite(sats) || sats < 0 || !quote || !Number.isFinite(quote.usd) || quote.usd <= 0 || !Number.isFinite(quote.checkedAt) || now < quote.checkedAt || now-quote.checkedAt > RATE_MAX_AGE_MS) return null;
    const value = sats / 1e8 * quote.usd;
    if (!Number.isFinite(value)) return null;
    return value > 0 && value < 0.01 ? '<$0.01' : dollars.format(value);
}
