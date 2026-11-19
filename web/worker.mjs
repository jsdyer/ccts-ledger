import {readWorkbook} from './workbook.mjs';
self.onmessage=async event=>{try{self.postMessage(await readWorkbook(event.data));}catch(e){self.postMessage({error:e.message});}};
