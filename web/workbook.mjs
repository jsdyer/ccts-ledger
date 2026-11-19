// The annual workbooks store the licence on sheet 1 and public data on sheet 2.
const decoder=new TextDecoder();
const decode=s=>s.replace(/&(amp|lt|gt|quot|apos|#x[0-9a-f]+|#\d+);/gi,(_,v)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[v]??String.fromCodePoint(v.startsWith('#x')?parseInt(v.slice(2),16):Number(v.slice(1)))));
function texts(xml){return [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(m=>decode(m[1])).join('');}
async function unzip(buffer){
 if(buffer.byteLength>16000000)throw Error('Choose one CCTS annual workbook under 16 MB.');
 const v=new DataView(buffer),bytes=new Uint8Array(buffer);
 let end=buffer.byteLength-22;
 while(end>=Math.max(0,buffer.byteLength-65557)&&v.getUint32(end,true)!==0x06054b50)end--;
 if(end<0||v.getUint32(end,true)!==0x06054b50)throw Error('This file is not an XLSX workbook.');
 const entries=new Map();let pos=v.getUint32(end+16,true);
 for(let i=0;i<v.getUint16(end+10,true);i++){
  if(v.getUint32(pos,true)!==0x02014b50)throw Error('Unexpected ZIP directory.');
  const method=v.getUint16(pos+10,true),size=v.getUint32(pos+20,true),plain=v.getUint32(pos+24,true),nameLen=v.getUint16(pos+28,true),extra=v.getUint16(pos+30,true),comment=v.getUint16(pos+32,true),offset=v.getUint32(pos+42,true),name=decoder.decode(bytes.slice(pos+46,pos+46+nameLen));
  entries.set(name,{method,size,plain,offset});pos+=46+nameLen+extra+comment;
 }
 async function get(name){
  const e=entries.get(name);if(!e)return '';
  if(e.plain>60000000)throw Error('The worksheet exceeds the supported size.');
  if(v.getUint32(e.offset,true)!==0x04034b50)throw Error('Invalid XLSX member.');
  const start=e.offset+30+v.getUint16(e.offset+26,true)+v.getUint16(e.offset+28,true);
  let payload=bytes.subarray(start,start+e.size);
  if(e.method===0)return decoder.decode(payload);
  if(e.method!==8)throw Error('Unsupported workbook compression.');
  const reader=new Blob([payload]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const chunks=[];let length=0;
  while(true){const r=await reader.read();if(r.done)break;length+=r.value.length;if(length>e.plain){await reader.cancel();throw Error('Invalid workbook size.');}chunks.push(r.value);}
  if(length!==e.plain)throw Error('Incomplete workbook entry.');
  return new Blob(chunks).text();
 }
 return get;
}
export async function readWorkbook(buffer){
 const member=await unzip(buffer);
 const strings=[...(await member('xl/sharedStrings.xml')).matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map(m=>texts(m[1]));
 const sheet=await member('xl/worksheets/sheet2.xml');let columns=null,type='',rows=[];
 for(const m of sheet.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)){
  const values={};
  for(const cell of m[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)){
   const ref=cell[1].match(/\br="([A-Z]+)\d+"/)?.[1];if(!ref||!cell[2])continue;
   const v=cell[2].match(/<v>([^<]*)<\/v>/)?.[1]||'';
   values[ref]=/\bt="s"/.test(cell[1])?(strings[Number(v)]??''):(v||texts(cell[2]));
  }
  if(!columns){
   const keys=Object.fromEntries(Object.entries(values).map(([k,v])=>[v,k]));
   if(!keys.Complaint||!keys['Service Provider'])continue;
   type=keys['Primary Category']?'issues':(keys.Closed||keys.Status)?'operational':'';
   if(!type)throw Error('Use an operational statistics or leading issues workbook.');
   columns=keys;continue;
  }
  const val=field=>values[columns[field]]||'';
  if(!val('Complaint')||!val('Service Provider'))continue;
  rows.push([val('Complaint'),val('Service Provider'),val('Province'),val('Line of Business'),(type==='issues'?val('Primary Category'):(val('Status')||val('Closed')))||'Unspecified',val('City/Area')]);
 }
 if(!rows.length)throw Error('The official annual workbook layout was not found.');
 return {type,rows};
}
