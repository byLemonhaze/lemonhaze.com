// The scheduler holds only a narrow trigger token, never a Stripe credential.
export default {
  async scheduled(_event,env){
    if(!env.SHOP_MAINTENANCE_TOKEN)throw new Error('Shop monitoring is not configured.');
    const response=await fetch('https://lemonhaze.com/api/shop/maintenance',{
      method:'POST',redirect:'manual',
      headers:{Authorization:`Bearer ${env.SHOP_MAINTENANCE_TOKEN}`},
      signal:AbortSignal.timeout(180000)
    });
    if(!response.ok)throw new Error('Shop monitoring request failed.');
    const result=await response.json();
    // Counts only; never log upstream bodies, order IDs, or secrets.
    console.log(JSON.stringify({checked:result.checked||0,needsReview:result.needsReview||0,alertsConfigured:result.configured===true,skipped:result.skipped===true}));
  },
  fetch(){return new Response('Not found',{status:404});}
};
