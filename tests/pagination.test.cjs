const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pageWindow}=require('../.angular/mock-tests/utils/pagination');
test('pagination covers every result once, including the partial final page',()=>{
 const items=Array.from({length:53},(_,i)=>i);
 const visited=[];
 for(let page=1;page<=5;page++){
   const window=pageWindow(items.length,page,12);
   visited.push(...items.slice(window.offset,window.end));
 }
 assert.deepEqual(visited,items);
 assert.deepEqual(pageWindow(53,5,12),{page:5,pages:5,offset:48,start:49,end:53});
});
test('filtering or removing results clamps an out-of-range page and handles empty lists',()=>{
 assert.deepEqual(pageWindow(5,9,12),{page:1,pages:1,offset:0,start:1,end:5});
 assert.deepEqual(pageWindow(0,9,12),{page:1,pages:1,offset:0,start:0,end:0});
 assert.equal(pageWindow(24,-5,12).page,1);
 assert.equal(pageWindow(24,NaN,12).page,1);
});
