export const commonHeaders={
 'Strict-Transport-Security':'max-age=31536000',
 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'strict-origin-when-cross-origin',
 'Permissions-Policy':'camera=(), microphone=(), geolocation=()'
};
export const siteReportPolicy="default-src 'self'; script-src 'self' https://challenges.cloudflare.com; frame-src 'self' blob: https://ordinals.com https://challenges.cloudflare.com; connect-src 'self' https:; img-src 'self' data: blob: https:; media-src 'self' blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com";
// The artist directory embeds the public site; other cross-origin parents remain blocked.
export const siteFramePolicy="frame-ancestors 'self' https://catalogue.gallery https://www.catalogue.gallery; object-src 'none'; base-uri 'self' https://ordinals.com; form-action 'self' https://checkout.stripe.com";
export const shopHeaders={
 'X-Frame-Options':'DENY',
 'Content-Security-Policy':"frame-ancestors 'none'; base-uri 'self' https://ordinals.com; object-src 'none'; form-action 'self' https://checkout.stripe.com",
 // Observe script restrictions before enforcing them on interactive artwork.
 'Content-Security-Policy-Report-Only':"default-src 'self'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self'; img-src 'self' data: https:; media-src 'self' blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com"
};
export function secureResponse(request,response){
 const url=new URL(request.url),headers=new Headers(response.headers);
 for(const [key,value] of Object.entries(commonHeaders))if(!headers.has(key)&&(key!=='Strict-Transport-Security'||url.protocol==='https:'))headers.set(key,value);
 // Public HTML may be framed by the artist directory. Keep direct shop/policy responses restricted below.
 const isHtml=(headers.get('content-type')||'').includes('text/html');
 const embeddable=/^\/(?:lab|visualizer|third-party)\//.test(url.pathname);
 if(isHtml&&!embeddable){headers.delete('X-Frame-Options');headers.set('Content-Security-Policy',siteFramePolicy);headers.set('Content-Security-Policy-Report-Only',siteReportPolicy);}
 if(/^\/(?:shop(?:\/|$)|privacy(?:\.html)?$|terms(?:\.html)?$)/.test(url.pathname))for(const [key,value] of Object.entries(shopHeaders))headers.set(key,value);
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
