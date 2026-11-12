import originals from './pixel-originals.json' with {type:'json'};
export const pixelDimensions=work=>originals[work?.id]||null;
export const pixelOriginalSource=work=>originals[work?.id]?`/images/pixel-originals/${work.id}.png`:null;
