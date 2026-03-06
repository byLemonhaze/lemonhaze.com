import { fetchProvenance } from '../src/data.js';

export {
  ABOUT_LEMONHAZE_TEXT,
  CAREER_HIGHLIGHTS_ITEMS,
  CHRONOLOGY_BY_YEAR,
  COL_DESCRIPTIONS,
  ETH_SUPPLY_DATA,
  LINK_OVERRIDES,
  MARKET_LINKS,
  MEDIA_ITEMS,
  ORDINALS_SUPPLY_DATA,
} from '../src/data.js';

export { fetchProvenance };

export const allArtworks = await fetchProvenance();
