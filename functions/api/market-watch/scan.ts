import {handleScan,type MarketEnv} from '../../../src/market-watch/lib/service';
export const onRequestPost:PagesFunction<MarketEnv>=({request,env})=>handleScan(request,env);
