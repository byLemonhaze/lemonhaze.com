// Theme only the drawn interface. Artwork pixels are painted directly with drawImage.
const backgrounds = new Set(['#070707','#080808','#090909','#090b08','#090a0b','#0e0e0d','#0c0c0b']);
const text = new Set(['#f1f1ed','#f0f0eb','#d0d0ca']);
const muted = new Set(['#92928b','#94948d','#777770','#454540']);
const lines = new Set(['#242420','#30302d','#a8a89f','#20201d']);
export function posterPaint(context, value) {
  const dark = context.canvas.dataset.presentation === 'black';
  if (backgrounds.has(value)) return dark ? '#242424' : '#f2f0e9';
  if (value === '#121210') return dark ? '#292929' : '#eae8e0';
  if (text.has(value)) return dark ? '#e9e7e2' : '#292d27';
  if (muted.has(value)) return dark ? '#aaa8a2' : '#777971';
  if (lines.has(value)) return dark ? '#575757' : '#c6c6bc';
  if (/^rgba\((241,241,237|208,208,202),/.test(value)) return dark ? '#999892' : '#8a8d82';
  // These labels overlay artwork, so retain their paired dark ground/light text.
  return value;
}
