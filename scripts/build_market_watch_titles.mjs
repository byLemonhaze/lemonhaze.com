import {readFile, readdir, writeFile} from 'node:fs/promises';
const read = async path => JSON.parse(await readFile(new URL('../'+path, import.meta.url), 'utf8'));
const titles = {};
function add(id, name) {
    if (/^[a-f0-9]{64}i\d+$/i.test(id || '') && typeof name === 'string' && name.trim()) {
        titles[id.toLowerCase()] = name.trim();
    }
}
for (const [id,name] of Object.entries(await read('src/market-watch/lib/inscription-title-overrides.json'))) add(id,name);
// Older sales fill gaps; the artist's provenance and edition manifests take precedence.
for (const row of (await read('public/data/sales-master/historical-sales-sheet.json')).rows) add(row.inscriptionId, row.artworkName);
for (const row of await read('public/data/provenance.json')) add(row.id, row.name);
for (const file of (await readdir(new URL('../public/data/collections/', import.meta.url))).sort()) {
    if (!file.endsWith('.json')) continue;
    const rows = await read('public/data/collections/'+file);
    if (Array.isArray(rows)) for (const row of rows) add(row.id, row.meta?.name || row.name);
}
await writeFile(new URL('../src/market-watch/lib/artwork-titles.json', import.meta.url), JSON.stringify(titles, null, 2)+'\n');
console.log(`Market Watch: ${Object.keys(titles).length} artwork titles indexed.`);
