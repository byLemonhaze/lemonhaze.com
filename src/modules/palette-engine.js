/**
 * Palette Engine — ported from the original TypeScript palette-engine project.
 * Pure math, zero dependencies. Seeded PRNG (mulberry32) + curated theme palettes.
 */

// ── Curated themes ─────────────────────────────────────────────────────────
const CURATED_PALETTES = [
    { id: 'my-love',         name: 'My Love',         colors: ['#E8DCB4','#E91E63','#660303','#038A86','#012057'] },
    { id: 'punch',           name: 'Punch',            colors: ['#E8DCB4','#006064','#FFC400','#D50000','#2962FF'] },
    { id: 'hypernova',       name: 'HyperNova',        colors: ['#FF004D','#FFB800','#00F5D4','#7209B7','#3A0CA3','#06D6A0','#FF6F61'] },
    { id: 'j',               name: 'J',                colors: ['#FFBE0B','#FB5607','#FF006E','#8338EC','#3A86FF'] },
    { id: '90s-festival',    name: '90s Festival',     colors: ['#E8DCB4','#6200EA','#CDDC39','#FF3D00','#00BFA5'] },
    { id: 'horizon',         name: 'Horizon',          colors: ['#E8DCB4','#004D40','#FFEA00','#1DE9B6','#6200EA'] },
    { id: 'edo',             name: 'Edo',              colors: ['#E8DCB4','#EAA221','#C02942','#542437','#53777A'] },
    { id: 'atelier',         name: 'Atelier',          colors: ['#E8DCB4','#223A5E','#9C9A40','#D9593D','#CE7B91','#025669'] },
    { id: 'goat',            name: 'gOat',             colors: ['#FBDAA6','#F37022','#B11016','#2ABA9E','#007096'] },
    { id: 'rouge-a-levres',  name: 'Rouge a Levres',  colors: ['#E8DCB4','#D00000','#9D0208','#6A040F','#370617'] },
    { id: 'kk',              name: 'KK',               colors: ['#F0F3BD','#1282A2','#034078','#001F54','#0A1128'] },
    { id: 'osaka-nights',    name: 'Osaka Nights',     colors: ['#E8DCB4','#E8DCB4','#4FC1E9','#E23E57','#F9C846','#5F76C8','#202A44'] },
    { id: 'rickj',           name: 'RickJ',            colors: ['#E8DCB4','#F4D58D','#2A9D8F','#264653','#002244','#A6192E'] },
    { id: 'winter-night',    name: 'Winter Night',     colors: ['#4E4E4E','#F511C0','#33312B','#4760E9','#410FF0'] },
    { id: 'neonzilla',       name: 'NEONZILLA',        colors: ['#00FFB0','#F90093','#6C00FF','#151515','#FDF6EF'] },
    { id: 'blue-sunset',     name: 'Blue Sunset',      colors: ['#FF9B85','#FCCB7E','#499DAF','#247BA0','#70C1B3'] },
    { id: 'belmont',         name: 'Belmont',          colors: ['#F4F7D9','#0091AD','#EABE7C','#A1E3D8','#E58B88'] },
    { id: 'los-angeles',     name: 'Los Angeles',      colors: ['#E8DCB4','#F8B195','#355C7D','#F67280','#C06C84'] },
    { id: 'q',               name: 'Q',                colors: ['#0A9396','#94D2BD','#E9D8A6','#EE9B00','#CA6702'] },
    { id: 'ocean',           name: 'Ocean',            colors: ['#E8DCB4','#566466','#235A56','#05668D','#00A896'] },
    { id: 'coral',           name: 'Coral',            colors: ['#DAC89A','#4C1E20','#7F8B69','#4F7674','#CB6661'] },
    { id: 'mamie',           name: 'Mamie',            colors: ['#EAE0D5','#422040','#73628A','#D09683','#F2D492'] },
    { id: 'aurora-drive',    name: 'AURORA DRIVE',     colors: ['#00FFC6','#FF3E7F','#FFE156','#3A0CA3','#1A1A1A','#7CFF01'] },
    { id: 'solstice',        name: 'SOLSTICE',         colors: ['#FF5C8D','#FFB84D','#06D6A0','#2E2E3A','#4A4E69','#7B2CBF'] },
    { id: 'electric-saints', name: 'ELECTRIC SAINTS',  colors: ['#FF006E','#00F5FF','#FFD23F','#7209B7','#1A1A1A','#F6F7F8','#06D6A0'] },
    { id: 'chrysalis',       name: 'CHRYSALIS',        colors: ['#31FFD7','#FF0099','#FFE36E','#1A1D2E','#6F00FF','#00D4FF','#FFEEE5'] },
    { id: 'lunarcyte',       name: 'LUNARCYTE',        colors: ['#00F2FF','#FF2E63','#F7FF00','#6E00FF','#161616','#80FFB4','#EDE6FF'] },
];

export const THEME_OPTIONS = CURATED_PALETTES.map(p => ({ id: p.id, name: p.name }));

// ── PRNG + math helpers ────────────────────────────────────────────────────
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const wrapHue = (v) => ((v % 360) + 360) % 360;
const shortestHueDelta = (from, to) => ((to - from + 540) % 360) - 180;

const mulberry32 = (seed) => {
    let t = seed;
    return () => {
        t += 0x6d2b79f5;
        let out = Math.imul(t ^ (t >>> 15), 1 | t);
        out ^= out + Math.imul(out ^ (out >>> 7), 61 | out);
        return ((out ^ (out >>> 14)) >>> 0) / 4294967296;
    };
};

const hashString = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
};

const gcd = (a, b) => { let x = Math.abs(a), y = Math.abs(b); while (y) { const t = y; y = x % y; x = t; } return x || 1; };

// ── Color conversion ───────────────────────────────────────────────────────
const hslToRgb = ({ h, s, l }) => {
    const sat = clamp(s, 0, 100) / 100, lig = clamp(l, 0, 100) / 100;
    const c = (1 - Math.abs(2 * lig - 1)) * sat, seg = wrapHue(h) / 60, x = c * (1 - Math.abs((seg % 2) - 1));
    let r = 0, g = 0, b = 0;
    if (seg < 1) [r, g, b] = [c, x, 0]; else if (seg < 2) [r, g, b] = [x, c, 0];
    else if (seg < 3) [r, g, b] = [0, c, x]; else if (seg < 4) [r, g, b] = [0, x, c];
    else if (seg < 5) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
    const m = lig - c / 2;
    return [r + m, g + m, b + m].map(ch => Math.round(clamp(ch, 0, 1) * 255));
};

const rgbToHex = ([r, g, b]) => '#' + [r, g, b].map(c => clamp(c, 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const hslToHex = (hsl) => rgbToHex(hslToRgb(hsl));

const hexToRgb = (hex) => {
    const n = hex.trim().replace('#', '');
    const ex = n.length === 3 ? n.split('').map(c => c + c).join('') : n;
    if (!/^[0-9a-fA-F]{6}$/.test(ex)) return [0, 0, 0];
    return [parseInt(ex.slice(0, 2), 16), parseInt(ex.slice(2, 4), 16), parseInt(ex.slice(4, 6), 16)];
};

const rgbToHsl = ([r, g, b]) => {
    const rd = clamp(r, 0, 255) / 255, gd = clamp(g, 0, 255) / 255, bd = clamp(b, 0, 255) / 255;
    const max = Math.max(rd, gd, bd), min = Math.min(rd, gd, bd), d = max - min;
    let h = 0;
    if (d) {
        if (max === rd) h = ((gd - bd) / d) % 6;
        else if (max === gd) h = (bd - rd) / d + 2;
        else h = (rd - gd) / d + 4;
        h *= 60;
    }
    const l = (max + min) / 2;
    return { h: wrapHue(h), s: d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)) * 100, l: l * 100 };
};

const hexToHsl = (hex) => rgbToHsl(hexToRgb(hex));

// ── Palette generation ─────────────────────────────────────────────────────
const pickPalette = (rand, availablePalettes, preferredId) => {
    const pool = availablePalettes.length > 0 ? availablePalettes : CURATED_PALETTES;
    if (preferredId) {
        const found = pool.find(p => p.id === preferredId);
        if (found) return found;
    }
    return pool[Math.floor(rand() * pool.length)] ?? pool[0] ?? CURATED_PALETTES[0];
};

const pickFiveFromPalette = (palette, rand) => {
    const base = palette.colors.map(hexToHsl);
    if (!base.length) return Array.from({ length: 5 }, (_, i) => ({ h: wrapHue(rand() * 360 + i * 37), s: 60 + rand() * 18, l: 34 + rand() * 28 }));
    if (base.length === 5) return [...base];
    if (base.length > 5) {
        const picked = [], start = Math.floor(rand() * base.length);
        let step = 1 + Math.floor(rand() * Math.max(1, base.length - 1)), safety = 0;
        while (gcd(step, base.length) !== 1 && safety++ < 16) step = (step % Math.max(1, base.length - 1)) + 1;
        let cursor = start;
        while (picked.length < 5) { picked.push(base[cursor]); cursor = (cursor + step) % base.length; }
        return picked;
    }
    const expanded = [...base];
    while (expanded.length < 5) {
        const src = expanded[expanded.length % base.length] ?? base[0];
        const tgt = base[Math.floor(rand() * base.length)] ?? src;
        const blend = 0.35 + rand() * 0.45;
        expanded.push({
            h: wrapHue(src.h + shortestHueDelta(src.h, tgt.h) * (1 - blend) + (rand() - 0.5) * 28),
            s: clamp(src.s * blend + tgt.s * (1 - blend) + (rand() - 0.5) * 16, 18, 96),
            l: clamp(src.l * blend + tgt.l * (1 - blend) + (rand() - 0.5) * 18, 10, 90),
        });
    }
    return expanded.slice(0, 5);
};

export const makeRandomSeed = () => Math.floor(Math.random() * 2_147_483_647);

export const generatePalette = (
    seed,
    lockedColors = [null, null, null, null, null],
    preferredThemeId,
    customThemes = []
) => {
    const rand = mulberry32(seed);
    const mergedThemes = [...CURATED_PALETTES, ...customThemes].filter((theme, index, list) =>
        !!theme &&
        typeof theme.id === 'string' &&
        theme.id.length > 0 &&
        typeof theme.name === 'string' &&
        Array.isArray(theme.colors) &&
        list.findIndex(entry => entry.id === theme.id) === index
    );
    const selected = pickPalette(rand, mergedThemes, preferredThemeId);
    const localRand = mulberry32(seed ^ hashString(selected.id));
    const baseColors = pickFiveFromPalette(selected, localRand);

    const locked = lockedColors.filter(Boolean);
    const avgLocked = locked.length
        ? (() => {
            const vecs = locked.map(c => ({ x: Math.cos(c.h * Math.PI / 180), y: Math.sin(c.h * Math.PI / 180) }));
            const ax = vecs.reduce((s, v) => s + v.x, 0) / vecs.length;
            const ay = vecs.reduce((s, v) => s + v.y, 0) / vecs.length;
            return (ax === 0 && ay === 0) ? null : wrapHue(Math.atan2(ay, ax) * 180 / Math.PI);
        })()
        : null;

    const genAvg = (() => {
        const vecs = baseColors.map(c => ({ x: Math.cos(c.h * Math.PI / 180), y: Math.sin(c.h * Math.PI / 180) }));
        const ax = vecs.reduce((s, v) => s + v.x, 0) / vecs.length;
        const ay = vecs.reduce((s, v) => s + v.y, 0) / vecs.length;
        return wrapHue(Math.atan2(ay, ax) * 180 / Math.PI);
    })();

    const hueRot = avgLocked === null ? (localRand() - 0.5) * 14 : shortestHueDelta(genAvg, avgLocked);
    const satDrift = (localRand() - 0.5) * 10;
    const ligDrift = (localRand() - 0.5) * 10;
    const contrastMode = localRand();

    const generated = baseColors.map((color, i) => {
        const edge = Math.abs(i - 2) / 2;
        const cb = contrastMode > 0.7 ? (i % 2 === 0 ? 8 : -7) : contrastMode < 0.24 ? (i === 2 ? 9 : -3) : 0;
        return {
            h: wrapHue(color.h + hueRot + (localRand() - 0.5) * (7 + edge * 6)),
            s: clamp(color.s + satDrift + (localRand() - 0.5) * (8 + edge * 4), 14, 97),
            l: clamp(color.l + ligDrift + (localRand() - 0.5) * (10 + edge * 4) + cb, 8, 92),
        };
    });

    const colors = generated.map((candidate, i) => {
        const hsl = lockedColors[i] ?? candidate;
        return { hsl, hex: hslToHex(hsl) };
    });

    return { colors, themeId: selected.id, themeName: selected.name };
};
