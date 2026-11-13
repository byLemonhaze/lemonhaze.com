import {coreWorkNote} from '../data/artwork-notes.js';
import { COL_DESCRIPTIONS, COLLECTION_DETAILS } from '../data.js';
import { workYear } from './model.js';
export function artworkMetadata(work) {
    const collection=COLLECTION_DETAILS[work.collection]||{};
    const description=work.reflection || work.description || work.about || (!/^1 (?:of|\/) ?1s/.test(work.collection) ? COL_DESCRIPTIONS[work.collection] : '') || '';
    return {
        description, coreNote:coreWorkNote(work),
        fields:[['Year',workYear(work)],['Medium',collection.medium||work.artwork_type],['Chain',work.chain],['Edition',work.editions],['Dimensions',work.dimensions],['Tools',collection.tools]]
            .filter(([,value])=>value && !['Custom','N/A'].includes(value)),
        original:work.chain==='Ethereum'?work.marketplace:work.id.startsWith('shop-')?null:`https://ordinals.com/inscription/${work.id}`,
    };
}
