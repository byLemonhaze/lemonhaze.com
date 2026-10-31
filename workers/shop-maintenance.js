import {deliverReviewAlerts} from '../server/shop/alerts.js';
import {reconcileOutstanding} from '../server/shop/maintenance.js';
export default {
  async scheduled(_event,env){
    const result=await reconcileOutstanding(env);
    await deliverReviewAlerts(env);
    // Counts only; do not log orders, addresses, Stripe objects, or secrets.
    if(result.needsReview)console.warn(`Shop reconciliation: ${result.needsReview} orders need review.`);
  },
  fetch(){return new Response('Not found',{status:404});}
};
