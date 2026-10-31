export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function assetUrl(value) {
 const raw=String(value??'');
 try {
  const url=new URL(raw,'https://lemonhaze.com');
  if(url.protocol!=='https:' || url.username || url.password)return '#';
  return esc(raw);
 } catch {return '#';}
}
