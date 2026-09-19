import {handleSnapshot,type MarketEnv} from '../../../src/market-watch/lib/service';
export const onRequestGet:PagesFunction<MarketEnv>=({env})=>handleSnapshot(env);
