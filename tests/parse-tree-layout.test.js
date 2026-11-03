'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const {prepareGrammar,run}=require('../protected/parser_backend');
const root=path.join(__dirname,'..');
function renderer(){
 const c={window:{LIBRARY:{}},document:{documentElement:{classList:{toggle(){}}},addEventListener(){},querySelector(s){return s==='#app'?{innerHTML:''}:s==='#toast'?{classList:{add(){},remove(){}}}:null;},querySelectorAll(){return[];}},fetch:()=>Promise.reject(Error('test offline')),setInterval(){},clearInterval(){},setTimeout(){},clearTimeout(){},console,URL,Blob};
 vm.runInNewContext(fs.readFileSync(path.join(root,'public/content.js'),'utf8'),c);
 let source=fs.readFileSync(path.join(root,'public/app.js'),'utf8');
 assert.ok(source.includes('init();\n})();'));
 source=source.replace('init();\n})();','window.__renderTree=treeMarkupReal;window.__setGrammar=g=>{state.analysis=g;};window.__setZoom=z=>{state.treeZoom=z;};init();\n})();');
 vm.runInNewContext(source,c);
 return {render:c.window.__renderTree,setGrammar:c.window.__setGrammar,setZoom:c.window.__setZoom};
}
function count(n){return 1+(n.children||[]).reduce((sum,c)=>sum+count(c),0);}
test('backend-produced arithmetic tree has root, ordered children, and actual connecting edges',()=>{
 const g=prepareGrammar('E -> E + T | T\nT -> T * F | F\nF -> ( E ) | id');
 const result=run(g,'ll1','id + id * id');assert.equal(result.ok,true);
 const r=renderer();r.setGrammar(g);
 const html=r.render(result.tree);
 assert.match(html,/class="parse-tree-svg"/);
 assert.match(html,/data-tree-symbol="E" data-tree-depth="0"/);
 assert.match(html,/data-tree-symbol="T" data-tree-depth="1"/);
 assert.match(html,/data-tree-symbol="E&#39;" data-tree-depth="1"/);
 assert.match(html,/data-tree-symbol="ε"/);
 assert.equal((html.match(/class="pt-node pt-/g)||[]).length,count(result.tree));
 assert.equal((html.match(/class="pt-edge"/g)||[]).length,count(result.tree)-1);
 const paths=[...html.matchAll(/class="pt-edge" d="M ([\d.]+) ([\d.]+) L ([\d.]+) ([\d.]+)"/g)];
 assert.ok(paths.every(m=>Number(m[2])<Number(m[4])),'Every edge must point downward');
 assert.ok(html.indexOf('class="pt-connectors"')<html.indexOf('class="pt-nodes"'),'Draw links behind symbols');
});
test('both original parsers produce trees accepted by the visualizer without altering results',()=>{
 const g=prepareGrammar('S -> a A\nA -> b | ε');const r=renderer();r.setGrammar(g);
 for(const mode of ['rd','ll1']){
  const result=run(g,mode,'a b');const snapshot=JSON.stringify(result);
  const html=r.render(result.tree);
  assert.equal((html.match(/class="pt-node pt-/g)||[]).length,count(result.tree));
  assert.match(html,/data-tree-symbol="a" data-tree-depth="1"/);
  assert.equal(JSON.stringify(result),snapshot,'Visualization must not mutate the backend result');
 }
 r.setZoom(1.45);assert.match(r.render(run(g,'ll1','a b').tree),/>145%</);
});
