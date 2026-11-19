import {$,el,select,stats,bars,data,download,toCsv,number} from './ui.mjs';
import {definitions,valueText,series,issueTotals} from './model.mjs';
let index,edition,currentFile,worker;
const optionPairs=values=>[...new Set(values.filter(Boolean))].sort().map(v=>[v,v]);
function show(){
 edition=index.editions.find(e=>e.year===Number($('period').value));
 select('brand',edition.brands.map(b=>[b.brand,b.brand]));
 const provider=$('brand').value,metric=$('metric').value,r=edition.brands.find(b=>b.brand===provider);
 $('brandTitle').textContent=provider+' · '+(edition.year-1)+'–'+edition.year;
 stats([['Accepted complaints',number(r.accepted)],['Share of accepted complaints',valueText(r.share,'share')],['Resolution rate',valueText(r.resolution,'resolution')]]);
 $('basis').textContent=definitions[metric]+(provider.startsWith('Rogers')?' Rogers and Shaw appear separately in earlier reports.':'');
 $('report').href=edition.url;
 $('issuefile').href=edition.workbooks.issues;$('opsfile').href=edition.workbooks.operational;
 $('history').replaceChildren(...series(index.editions,provider,metric).map(([year,n])=>el('p',(year-1)+'–'+year+' · '+valueText(n,metric),'fine')));
 $('count').textContent='Ten leading entries published for '+(edition.year-1)+'–'+edition.year+'. '+definitions[metric];
 bars('bars',edition.brands.toSorted((a,b)=>b[metric]-a[metric]).map(b=>[b.brand,b[metric]]),n=>valueText(n,metric));
}
function localView(){
 const d=issueTotals(currentFile.rows,{provider:$('localBrand').value,province:$('province').value,service:$('service').value});
 $('localCount').textContent=number(d.count)+' '+(currentFile.type==='issues'?'issue rows':'operational rows')+' across '+number(d.distinct)+' distinct complaint IDs in this workbook. All recorded rows matching your selection are included.';
 bars('localRows',d.groups,n=>number(n));
}
function clearFile(){
 worker?.terminate();worker=null;currentFile=null;$('file').value='';$('local').hidden=true;$('localStatus').textContent='';
}
async function openFile(){
 const f=$('file').files[0];if(!f)return;clearFile();$('localStatus').textContent='Reading '+f.name+' locally…';
 worker=new Worker('./worker.mjs',{type:'module'});const currentWorker=worker;
 const finish=()=>{currentWorker.terminate();if(worker===currentWorker)worker=null;};
 currentWorker.onmessage=({data:result})=>{
  if(worker!==currentWorker)return;finish();if(result.error){$('localStatus').textContent=result.error;return;}
  currentFile=result;
  for(const [id,column,label] of [['localBrand',1,'All providers'],['province',2,'All provinces'],['service',3,'All services']]){
   select(id,[['',label],...optionPairs(result.rows.map(r=>r[column]))]);$(id).value='';$(id).closest('label').hidden=result.type==='operational'&&column>1;
  }
  $('localStatus').textContent=f.name+' · '+(result.type==='issues'?'Issue categories':'Recorded complaint statuses');$('local').hidden=false;localView();
 };
 currentWorker.onerror=()=>{if(worker===currentWorker){finish();$('localStatus').textContent='The workbook could not be read. Try the official download above.';}};
 try{const bytes=await f.arrayBuffer();if(worker===currentWorker)currentWorker.postMessage(bytes,[bytes]);}
 catch{finish();$('localStatus').textContent='File could not be opened.';}
}
async function start(){
 index=await data('./data/index.json');
 $('edition').textContent=index.count+' provider-year records · '+index.first+' to '+index.latest+' · Retrieved '+index.retrieved;
 select('period',[...index.editions].reverse().map(e=>[String(e.year),(e.year-1)+'–'+e.year]));
 for(const id of ['period','brand','metric'])$(id).onchange=show;
 $('export').onclick=()=>download('ccts-'+edition.year+'.csv',toCsv([Object.keys(edition.brands[0]),...edition.brands.map(r=>Object.values(r))]));
 for(const id of ['localBrand','province','service'])$(id).onchange=localView;
 $('file').onchange=openFile;$('clear').onclick=clearFile;show();
}
start().catch(()=>{$('edition').textContent='Unable to load the comparison. Open the report source below or reload.';});
