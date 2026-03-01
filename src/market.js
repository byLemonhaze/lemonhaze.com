import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { SimplePool, finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools';

bitcoin.initEccLib(ecc);

const NETWORK = bitcoin.networks.bitcoin;
const NETWORK_NAME = 'mainnet';
const EXCHANGE_NAME = 'lemonhaze';
const ORDER_EVENT_KIND = 802;
const MEMPOOL_BASE_URL = 'https://mempool.space';
const MEMPOOL_API_URL = `${MEMPOOL_BASE_URL}/api`;
const ORDINALS_BASE_URL = 'https://ordinals.com';
const ALL_ORIGINS_RAW_URL = 'https://api.allorigins.win/raw?url=';
const NOSTR_RELAYS = ['wss://nostr.openordex.org'];
const DUMMY_UTXO_VALUE = 1_000;
const FEE_LEVEL = 'hourFee';

const pool = new SimplePool();
const txHexByIdCache = new Map();
const inscriptionDataCache = new Map();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function stripHtml(value) {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSats(value) {
  const normalized = String(value || '').replace(/[^\d]/g, '');
  return normalized ? Number(normalized) : 0;
}

function toXOnly(pubKey) {
  return pubKey.length === 32 ? pubKey : pubKey.slice(1, 33);
}

function base64ToHex(str) {
  return atob(str)
    .split('')
    .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
}

function hexToBase64(hex) {
  const bytes = hex.match(/.{1,2}/g) || [];
  return btoa(bytes.map(byte => String.fromCharCode(parseInt(byte, 16))).join(''));
}

function readTag(event, tagName) {
  return event.tags.find(tag => tag?.[0] === tagName)?.[1];
}

function normalizeInscriptionId(value) {
  return String(value || '').trim().replace(':', 'i');
}

function splitOutputRef(outputRef) {
  const [txid, voutRaw] = String(outputRef || '').split(':');
  const vout = Number(voutRaw);
  if (!txid || !Number.isInteger(vout) || vout < 0) {
    throw new Error(`Invalid output reference: ${outputRef}`);
  }
  return { txid, vout };
}

async function fetchTextWithFallback(url) {
  try {
    const directResponse = await fetch(url, { cache: 'no-store' });
    if (!directResponse.ok) {
      throw new Error(`${directResponse.status} ${directResponse.statusText}`);
    }
    return await directResponse.text();
  } catch (_directError) {
    const proxiedUrl = `${ALL_ORIGINS_RAW_URL}${encodeURIComponent(url)}`;
    const proxyResponse = await fetch(proxiedUrl, { cache: 'no-store' });
    if (!proxyResponse.ok) {
      throw new Error(`Failed to fetch ${url} via fallback proxy (${proxyResponse.status} ${proxyResponse.statusText})`);
    }
    return await proxyResponse.text();
  }
}

async function fetchJson(url, options = undefined) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

function parseInscriptionHtml(inscriptionId, html) {
  const fields = {};
  const matches = [...html.matchAll(/<dt[^>]*>(.*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gim)];

  for (const [, rawKey, rawValue] of matches) {
    const key = stripHtml(rawKey).toLowerCase();
    const value = stripHtml(rawValue);
    fields[key] = value;
  }

  const numberMatch = html.match(/<h1[^>]*>\s*Inscription\s*([^<]+)\s*<\/h1>/i);
  const output = fields.output || '';
  const address = fields.address || '';
  const outputValueSats = parseSats(fields['output value']);

  if (!output || !address || !outputValueSats) {
    throw new Error(`Could not parse inscription details for ${inscriptionId}`);
  }

  return {
    id: normalizeInscriptionId(inscriptionId),
    number: numberMatch?.[1]?.trim() || '',
    output,
    outputValueSats,
    ownerAddress: address,
  };
}

export async function fetchInscriptionData(inscriptionId, { force = false } = {}) {
  const normalizedId = normalizeInscriptionId(inscriptionId);
  if (!force && inscriptionDataCache.has(normalizedId)) {
    return inscriptionDataCache.get(normalizedId);
  }

  const html = await fetchTextWithFallback(`${ORDINALS_BASE_URL}/inscription/${normalizedId}`);
  const parsed = parseInscriptionHtml(normalizedId, html);
  inscriptionDataCache.set(normalizedId, parsed);
  return parsed;
}

async function getTxHexById(txid) {
  if (!txHexByIdCache.has(txid)) {
    const txHex = await fetchTextWithFallback(`${MEMPOOL_API_URL}/tx/${txid}/hex`);
    txHexByIdCache.set(txid, txHex);
  }
  return txHexByIdCache.get(txid);
}

async function getAddressUtxos(address) {
  return fetchJson(`${MEMPOOL_API_URL}/address/${address}/utxo`);
}

async function getRecommendedFeeRate() {
  try {
    const fees = await fetchJson(`${MEMPOOL_API_URL}/v1/fees/recommended`);
    const feeRate = Number(fees?.[FEE_LEVEL] || fees?.fastestFee || 15);
    return Number.isFinite(feeRate) && feeRate > 0 ? feeRate : 15;
  } catch (_error) {
    return 15;
  }
}

async function doesUtxoContainInscription(utxo) {
  const html = await fetchTextWithFallback(`${ORDINALS_BASE_URL}/output/${utxo.txid}:${utxo.vout}`);
  return html.includes('class=thumbnails');
}

function calculateFee(vins, vouts, recommendedFeeRate, includeChangeOutput = true) {
  const baseTxSize = 10;
  const inSize = 180;
  const outSize = 34;
  const txSize = baseTxSize + vins * inSize + vouts * outSize + (includeChangeOutput ? outSize : 0);
  return Math.ceil(txSize * recommendedFeeRate);
}

async function selectSpendableUtxos(utxos, amount, vins, vouts, feeRate) {
  const selected = [];
  let selectedAmount = 0;

  const candidates = [...utxos]
    .filter(utxo => Number(utxo.value) > DUMMY_UTXO_VALUE)
    .sort((a, b) => Number(b.value) - Number(a.value));

  for (const utxo of candidates) {
    if (await doesUtxoContainInscription(utxo)) {
      continue;
    }

    selected.push(utxo);
    selectedAmount += Number(utxo.value);

    const needed = amount + DUMMY_UTXO_VALUE + calculateFee(vins + selected.length, vouts, feeRate);
    if (selectedAmount >= needed) {
      break;
    }
  }

  if (selectedAmount < amount) {
    throw new Error('Not enough spendable BTC balance for this purchase.');
  }

  return selected;
}

function isLikelyHex(value) {
  return /^[0-9a-fA-F]+$/.test(value || '');
}

function toPsbtBase64(payload) {
  if (!payload || typeof payload !== 'string') {
    throw new Error('Wallet returned an invalid PSBT payload.');
  }

  const trimmed = payload.trim();

  if (isLikelyHex(trimmed)) {
    return bitcoin.Psbt.fromHex(trimmed, { network: NETWORK }).toBase64();
  }

  return trimmed;
}

function validateSellerPsbtAndExtractPrice(sellerSignedPsbtBase64, expectedUtxo) {
  const sellerPsbt = bitcoin.Psbt.fromBase64(sellerSignedPsbtBase64, { network: NETWORK });
  const sellerInput = sellerPsbt.txInputs[0];
  const sellerInputRef = `${sellerInput.hash.reverse().toString('hex')}:${sellerInput.index}`;

  if (sellerInputRef !== expectedUtxo) {
    throw new Error('Listing PSBT does not match the current inscription UTXO.');
  }

  if (sellerPsbt.txInputs.length !== 1 || sellerPsbt.txOutputs.length !== 1) {
    throw new Error('Listing PSBT must contain exactly one input and one output.');
  }

  try {
    sellerPsbt.extractTransaction(true);
  } catch (error) {
    if (error?.message === 'Not finalized') {
      throw new Error('Listing PSBT is not fully signed/finalized.');
    }
    if (error?.message !== 'Outputs are spending more than Inputs') {
      throw new Error(`Invalid listing PSBT: ${error?.message || error}`);
    }
  }

  const output = sellerPsbt.txOutputs[0];
  return { priceSats: Number(output.value), sellerPsbt };
}

export function satToBtc(sats) {
  return Number(sats) / 1e8;
}

export function btcToSat(btc) {
  return Math.floor(Number(btc) * 1e8);
}

export function formatListingPrice(priceSats) {
  return `${satToBtc(priceSats).toFixed(8)} BTC (${Number(priceSats).toLocaleString()} sats)`;
}

export function shortPsbt(psbtBase64, head = 18, tail = 14) {
  if (!psbtBase64 || psbtBase64.length <= head + tail + 3) {
    return psbtBase64 || '';
  }
  return `${psbtBase64.slice(0, head)}...${psbtBase64.slice(-tail)}`;
}

export function isUnisatInstalled() {
  return typeof window !== 'undefined' && typeof window.unisat !== 'undefined';
}

async function ensureMainnet() {
  const network = await window.unisat.getNetwork?.();
  if (network && network !== 'livenet') {
    throw new Error('Please switch Unisat to Bitcoin mainnet (livenet).');
  }
}

export async function getConnectedUnisatAddress() {
  if (!isUnisatInstalled()) return null;

  try {
    await ensureMainnet();
    const accounts = await window.unisat.getAccounts?.();
    return accounts?.[0] || null;
  } catch (_error) {
    return null;
  }
}

export async function connectUnisat() {
  if (!isUnisatInstalled()) {
    throw new Error('Unisat wallet is required for this marketplace.');
  }

  await ensureMainnet();

  const accounts = await window.unisat.requestAccounts();
  const address = accounts?.[0];
  if (!address) {
    throw new Error('Unable to read an address from Unisat.');
  }

  return { address };
}

function getDefaultPaymentAddress(inscriptionData, walletAddress) {
  if (walletAddress) return walletAddress;
  return inscriptionData.ownerAddress;
}

async function generateSalePsbt(inscriptionOutput, priceSats, paymentAddress) {
  const psbt = new bitcoin.Psbt({ network: NETWORK });
  const { txid, vout } = splitOutputRef(inscriptionOutput);
  const tx = bitcoin.Transaction.fromHex(await getTxHexById(txid));

  psbt.addInput({
    hash: txid,
    index: vout,
    nonWitnessUtxo: tx.toBuffer(),
    witnessUtxo: tx.outs[vout],
    sighashType: bitcoin.Transaction.SIGHASH_SINGLE | bitcoin.Transaction.SIGHASH_ANYONECANPAY,
    tapInternalKey: toXOnly(tx.outs[vout].script.subarray(2, 34)),
  });

  psbt.addOutput({
    address: paymentAddress,
    value: priceSats,
  });

  return psbt.toBase64();
}

async function publishListingEvent({ sellerSignedPsbtBase64, inscriptionData, priceSats }) {
  const sk = generateSecretKey();
  const pk = getPublicKey(sk);

  const eventTemplate = {
    kind: ORDER_EVENT_KIND,
    pubkey: pk,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['n', NETWORK_NAME],
      ['t', 'sell'],
      ['i', inscriptionData.id],
      ['m', String(inscriptionData.number || '')],
      ['u', inscriptionData.output],
      ['s', String(priceSats)],
      ['x', EXCHANGE_NAME],
    ],
    content: sellerSignedPsbtBase64,
  };

  const signedEvent = finalizeEvent(eventTemplate, sk);
  const publishPromises = pool.publish(NOSTR_RELAYS, signedEvent, { maxWait: 6000 });

  if (!publishPromises.length) {
    throw new Error('No relay is available to publish this listing.');
  }

  await Promise.any(publishPromises);
}

export async function createListingWithUnisat({ inscriptionData, priceSats, paymentAddress }) {
  if (!inscriptionData?.output) {
    throw new Error('Missing inscription output reference.');
  }
  if (!Number.isFinite(priceSats) || priceSats <= 0) {
    throw new Error('Please enter a valid BTC price.');
  }

  const { address: walletAddress } = await connectUnisat();
  const payoutAddress = getDefaultPaymentAddress(inscriptionData, paymentAddress || walletAddress);

  const unsignedSalePsbt = await generateSalePsbt(inscriptionData.output, priceSats, payoutAddress);
  const signedPayload = await window.unisat.signPsbt(base64ToHex(unsignedSalePsbt));
  const sellerSignedPsbtBase64 = toPsbtBase64(signedPayload);

  const { priceSats: validatedPriceSats } = validateSellerPsbtAndExtractPrice(
    sellerSignedPsbtBase64,
    inscriptionData.output,
  );

  if (validatedPriceSats !== priceSats) {
    throw new Error('Signed listing price does not match the requested price.');
  }

  await publishListingEvent({ sellerSignedPsbtBase64, inscriptionData, priceSats });

  return {
    sellerSignedPsbtBase64,
    priceSats,
  };
}

function decodeListingEvent(event, inscriptionData) {
  const eventInscriptionId = normalizeInscriptionId(readTag(event, 'i'));
  const utxoTag = readTag(event, 'u');
  const priceTag = Number(readTag(event, 's'));

  if (!eventInscriptionId || eventInscriptionId !== inscriptionData.id) {
    return null;
  }

  if (!utxoTag || utxoTag !== inscriptionData.output) {
    return null;
  }

  const { priceSats } = validateSellerPsbtAndExtractPrice(event.content, inscriptionData.output);
  if (!Number.isFinite(priceSats) || priceSats <= 0) {
    return null;
  }

  if (Number.isFinite(priceTag) && priceTag !== priceSats) {
    return null;
  }

  return {
    id: event.id,
    createdAt: event.created_at,
    priceSats,
    sellerSignedPsbtBase64: event.content,
    inscriptionId: eventInscriptionId,
    inscriptionOutput: utxoTag,
  };
}

export async function getBestListingForInscription(inscriptionData) {
  const events = await pool.querySync(
    NOSTR_RELAYS,
    {
      kinds: [ORDER_EVENT_KIND],
      '#n': [NETWORK_NAME],
      '#t': ['sell'],
      '#i': [inscriptionData.id],
      '#u': [inscriptionData.output],
      limit: 100,
    },
    { maxWait: 3_500 },
  );

  const listings = events
    .map(event => {
      try {
        return decodeListingEvent(event, inscriptionData);
      } catch (_error) {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => (a.priceSats - b.priceSats) || (b.createdAt - a.createdAt));

  return listings[0] || null;
}

async function findDummyUtxo(utxos) {
  const candidates = utxos
    .filter(utxo => Number(utxo.value) <= DUMMY_UTXO_VALUE)
    .sort((a, b) => Number(a.value) - Number(b.value));

  for (const candidate of candidates) {
    if (!(await doesUtxoContainInscription(candidate))) {
      return candidate;
    }
  }

  return null;
}

async function buildDummyUtxoPsbt(payerAddress, selectedUtxos, feeRate) {
  const psbt = new bitcoin.Psbt({ network: NETWORK });
  let totalValue = 0;

  for (const utxo of selectedUtxos) {
    const tx = bitcoin.Transaction.fromHex(await getTxHexById(utxo.txid));
    psbt.addInput({
      hash: utxo.txid,
      index: Number(utxo.vout),
      nonWitnessUtxo: tx.toBuffer(),
    });
    totalValue += Number(utxo.value);
  }

  psbt.addOutput({
    address: payerAddress,
    value: DUMMY_UTXO_VALUE,
  });

  const fee = calculateFee(psbt.txInputs.length, psbt.txOutputs.length, feeRate);
  const changeValue = totalValue - DUMMY_UTXO_VALUE - fee;

  if (changeValue <= 546) {
    throw new Error('Insufficient balance to create a reusable dummy UTXO.');
  }

  psbt.addOutput({
    address: payerAddress,
    value: changeValue,
  });

  return psbt.toBase64();
}

async function signAndBroadcastPsbt(psbtBase64) {
  const signedPayload = await window.unisat.signPsbt(base64ToHex(psbtBase64));
  const signedBase64 = toPsbtBase64(signedPayload);
  const signedPsbt = bitcoin.Psbt.fromBase64(signedBase64, { network: NETWORK });

  try {
    signedPsbt.finalizeAllInputs();
  } catch (_error) {
    // Some inputs can already be finalized by the wallet; extraction handles final validity.
  }

  let txHex;
  try {
    txHex = signedPsbt.extractTransaction().toHex();
  } catch (error) {
    throw new Error(`Could not finalize transaction: ${error?.message || error}`);
  }

  const response = await fetch(`${MEMPOOL_API_URL}/tx`, {
    method: 'POST',
    body: txHex,
  });

  if (!response.ok) {
    throw new Error(`Broadcast failed: ${response.status} ${response.statusText} - ${await response.text()}`);
  }

  const txid = await response.text();
  return txid.trim();
}

async function ensureDummyUtxo(payerAddress, utxos, feeRate) {
  const existingDummy = await findDummyUtxo(utxos);
  if (existingDummy) {
    return existingDummy;
  }

  const fundingUtxos = await selectSpendableUtxos(
    utxos,
    DUMMY_UTXO_VALUE,
    0,
    1,
    feeRate,
  );

  const dummyPsbt = await buildDummyUtxoPsbt(payerAddress, fundingUtxos, feeRate);
  await signAndBroadcastPsbt(dummyPsbt);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    await sleep(1_500);
    const refreshed = await getAddressUtxos(payerAddress);
    const dummyUtxo = await findDummyUtxo(refreshed);
    if (dummyUtxo) {
      return dummyUtxo;
    }
  }

  throw new Error('Created a dummy UTXO, but it is not visible yet. Please retry in a few seconds.');
}

async function buildBuyPsbt({ inscriptionData, listing, payerAddress, dummyUtxo, paymentUtxos, feeRate }) {
  const psbt = new bitcoin.Psbt({ network: NETWORK });
  const sellerSignedPsbt = bitcoin.Psbt.fromBase64(listing.sellerSignedPsbtBase64, { network: NETWORK });

  const dummyTx = bitcoin.Transaction.fromHex(await getTxHexById(dummyUtxo.txid));
  psbt.addInput({
    hash: dummyUtxo.txid,
    index: Number(dummyUtxo.vout),
    nonWitnessUtxo: dummyTx.toBuffer(),
  });

  psbt.addOutput({
    address: payerAddress,
    value: Number(dummyUtxo.value) + Number(inscriptionData.outputValueSats),
  });

  psbt.addInput({
    ...sellerSignedPsbt.data.globalMap.unsignedTx.tx.ins[0],
    ...sellerSignedPsbt.data.inputs[0],
  });

  psbt.addOutput({
    ...sellerSignedPsbt.data.globalMap.unsignedTx.tx.outs[0],
  });

  let totalPaymentValue = 0;

  for (const utxo of paymentUtxos) {
    const tx = bitcoin.Transaction.fromHex(await getTxHexById(utxo.txid));
    psbt.addInput({
      hash: utxo.txid,
      index: Number(utxo.vout),
      nonWitnessUtxo: tx.toBuffer(),
    });

    totalPaymentValue += Number(utxo.value);
  }

  psbt.addOutput({
    address: payerAddress,
    value: DUMMY_UTXO_VALUE,
  });

  const fee = calculateFee(psbt.txInputs.length, psbt.txOutputs.length, feeRate);
  const changeValue = totalPaymentValue - DUMMY_UTXO_VALUE - Number(listing.priceSats) - fee;

  if (changeValue <= 546) {
    throw new Error('Insufficient BTC balance to cover listing price and fees.');
  }

  psbt.addOutput({
    address: payerAddress,
    value: changeValue,
  });

  return psbt.toBase64();
}

export async function buyListingWithUnisat({ inscriptionData, listing, payerAddress }) {
  if (!listing?.sellerSignedPsbtBase64) {
    throw new Error('Missing listing PSBT.');
  }

  const feeRate = await getRecommendedFeeRate();
  const currentUtxos = await getAddressUtxos(payerAddress);
  const dummyUtxo = await ensureDummyUtxo(payerAddress, currentUtxos, feeRate);

  const latestUtxos = await getAddressUtxos(payerAddress);
  const paymentUtxos = await selectSpendableUtxos(
    latestUtxos,
    Number(listing.priceSats) + DUMMY_UTXO_VALUE,
    1,
    3,
    feeRate,
  );

  const buyPsbt = await buildBuyPsbt({
    inscriptionData,
    listing,
    payerAddress,
    dummyUtxo,
    paymentUtxos,
    feeRate,
  });

  const txid = await signAndBroadcastPsbt(buyPsbt);
  return {
    txid,
    explorerUrl: `${MEMPOOL_BASE_URL}/tx/${txid}`,
  };
}

