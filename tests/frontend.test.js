'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const cwd=path.join(__dirname,'..');
const C={window:{}};vm.runInNewContext(fs.readFileSync(path.join(cwd,'public/content.js'),'utf8'),C);
function bootstrap(){
 const app={innerHTML:''};const listeners={};const toast={textContent:'',classList:{add(){},remove(){}}};
 const state={window:{LIBRARY:C.window.LIBRARY,scrollTo(){},print(){}},document:{documentElement:{classList:{toggle(){}}},addEventListener(ev,cb){listeners[ev]=cb;},querySelector(sel){if(sel==='#app')return app;if(sel==='#toast')return toast;return null;},querySelectorAll(){return[];},body:{append(){}}},fetch:async url=>({ok:true,json:async()=>url.includes('health')?{ok:true}:{ok:true,examples:[{id:'arithmetic',name:'Example',grammar:'S -> a',input:'a'}]}}),setInterval:()=>1,clearInterval(){},setTimeout:()=>1,clearTimeout(){},URL,Blob,console};
 vm.runInNewContext(fs.readFileSync(path.join(cwd,'public/app.js'),'utf8'),state);
 const click=async (action,extra={})=>{await listeners.click({target:{closest(){return{dataset:{action,...extra},disabled:false};}}});return app.innerHTML;};
 return {app,click,listeners};
}
test('all eight frontend sections render without client-side exceptions',async()=>{
 const {app,click}=bootstrap();
 assert.match(app.innerHTML,/Parsing, made/);
 for(const page of ['map','learn','flows','lab','sim','practice','glossary','search']){
  await click('go',{page});assert.ok(app.innerHTML.length>1800,`${page}: empty screen`);
  assert.match(app.innerHTML,page==='search'?/breadcrumb[^>]*>PARSELAB/:/nav-btn active/);
 }
});
test('interactive map expansion and lesson links render meaningful views',async()=>{
 const {app,click}=bootstrap();
 await click('go',{page:'map'});const collapsed=(app.innerHTML.match(/class="tree-node/g)||[]).length;
 await click('expand-all');const expanded=(app.innerHTML.match(/class="tree-node/g)||[]).length;
 assert.ok(expanded>collapsed);
 await click('select-node',{id:'first'});assert.match(app.innerHTML,/FIRST sets/);
 await click('go',{page:'learn',id:'first'});assert.match(app.innerHTML,/Step-by-step reasoning/);
 await click('go',{page:'map',id:'first'});assert.match(app.innerHTML,/FIRST sets/);
});
test('flowchart selection and quiz feedback are operational',async()=>{
 const {app,click}=bootstrap();
 await click('go',{page:'flows',id:'ll1'});
 assert.match(app.innerHTML,/Stack begins with/);
 await click('flow-next');assert.match(app.innerHTML,/Top and lookahead both/);
 await click('go',{page:'practice'});
 await click('answer',{index:'0',choice:'1'});
 assert.match(app.innerHTML,/Correct/);
 await click('go',{page:'glossary'});
 await click('select-glossary',{id:'first'});assert.match(app.innerHTML,/SELECTED TERM/);
});
test('requested cleanup removes redundant footer/sidebar notices and expands Learn Concepts',async()=>{
 const {app,click}=bootstrap();
 assert.doesNotMatch(app.innerHTML,/ParseLab · Simulation of Top-Down Parsers · B\.Tech CSBS/);
 assert.doesNotMatch(app.innerHTML,/Original Node\.js backend preserved, with separate web adapter/);
 assert.doesNotMatch(app.innerHTML,/Parser engine connected/);
 await click('go',{page:'learn',id:'first'});
 assert.doesNotMatch(app.innerHTML,/class="lesson-sidebar"|CONCEPT LESSONS/);
 assert.match(app.innerHTML,/class="panel padded article reading" style="max-width:none;width:100%"/);
 assert.match(app.innerHTML,/Step-by-step reasoning/);
 assert.match(app.innerHTML,/Recommended next lesson/);
 assert.match(app.innerHTML,/Locate in map/);
 await click('go',{page:'map',id:'first'});
 assert.match(app.innerHTML,/Knowledge Map/);
});
