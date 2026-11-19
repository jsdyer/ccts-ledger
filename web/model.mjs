export const definitions={accepted:'Complaints the CCTS accepted during this report year.',share:'Share of all complaints accepted by CCTS in this report year.',closed:'Complaints concluded during this reporting year. Acceptance may have been in an earlier year.',resolution:'CCTS divides resolved complaints by concluded complaints for that provider.',escalation:'CCTS divides complaints moving to a later stage by all concluded complaints for the provider. The annual table supplies the published rate.'};
export const valueText=(n,key)=>n==null?'Outside the published comparison':(['closed','accepted'].includes(key)?n.toLocaleString('en-CA'):n.toFixed(1)+'%');
export function series(editions,brand,key){return editions.map(e=>[e.year,e.brands.find(r=>r.brand===brand)?.[key]??null]);}
export function issueTotals(rows,filters){
 const grouped=new Map(),ids=new Set();let count=0;
 for(const [id,provider,province,service,topic,city] of rows){
  if(filters.provider&&provider!==filters.provider||filters.province&&province!==filters.province||filters.service&&service!==filters.service||filters.city&&city!==filters.city)continue;
  ids.add(id);count++;grouped.set(topic,(grouped.get(topic)||0)+1);
 }
 return {count,distinct:ids.size,groups:[...grouped].sort((a,b)=>b[1]-a[1])};
}
