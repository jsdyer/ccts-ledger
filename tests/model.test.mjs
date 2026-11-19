import test from 'node:test';
import assert from 'node:assert/strict';
import {series,issueTotals} from '../web/model.mjs';
test('separate brands and absent ranks',()=>{
 assert.deepEqual(series([{year:2024,brands:[{brand:'Rogers',accepted:5}]},{year:2025,brands:[{brand:'Rogers/Shaw',accepted:9}]}],'Rogers','accepted'),[[2024,5],[2025,null]]);
});
test('one complaint can raise several issues',()=>{
 const r=[['a','X','Nova Scotia','Wireless','Billing','Halifax'],['a','X','Nova Scotia','Wireless','Service','Dartmouth'],['b','Y','Ontario','TV','Billing']];
 const g=issueTotals(r,{province:'Nova Scotia'});assert.equal(g.count,2);assert.equal(g.distinct,1);assert.equal(issueTotals(r,{city:'Halifax'}).count,1);
});
