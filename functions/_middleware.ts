import {secureResponse} from '../server/security-headers.js';
export const onRequest: PagesFunction = async context => secureResponse(context.request,await context.next());
