import {handleShop} from '../../../server/shop/handler.js';
export const onRequest: PagesFunction = ({request,env}) => handleShop(request,env);
