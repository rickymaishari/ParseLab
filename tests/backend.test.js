'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {server,compute,EXAMPLES}=require('../server');
const {prepareGrammar,run}=require('../protected/parser_backend');
const cwd=path.join(__dirname,'..');
test('protected backend and CLI hashes equal original uploads',()=>{
 const expected=require('../integrity.json');
 for(const [file,hash] of Object.entries(expected)){
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(cwd,file))).digest('hex'),hash,file);
 }
});
test('original CLI entry remains independently usable',()=>{
 const p=spawnSync(process.execPath,['protected/main.js'],{cwd,input:'S -> a\n\n4\n',encoding:'utf8',timeout:4000});
 assert.equal(p.status,0,p.stderr);assert.match(p.stdout,/FIRST/);assert.match(p.stdout,/Which parser/);
});
test('real backend accepts and rejects with both parsers',()=>{
 const grammar='S -> a A\nA -> b | ε',g=prepareGrammar(grammar);
 for(const mode of ['rd','ll1']){
  const yes=run(g,mode,'a b'),no=run(g,mode,'a a');
  assert.equal(yes.ok,true); assert.ok(yes.tree);
  assert.equal(no.ok,false);
  assert.ok((yes.steps||yes.trace).length>0);
 }
});
test('original grammar transformations and FIRST/FOLLOW remain operational',()=>{
 const g=prepareGrammar('E -> E + T | T\nT -> T * F | F\nF -> ( E ) | id');
 assert.match(g.fixed,/E' ->/);assert.equal(g.info.first["E'"].has('ε'),true);
 assert.equal(g.info.follow.E.has('$'),true);
 assert.equal(g.info.conflicts.length,0);
});
test('conflicts prevent LL(1) but recursive descent still works',()=>{
 const g=prepareGrammar('S -> A | B\nA -> a\nB -> a');
 assert.equal(g.info.conflicts.length,1);
 assert.match(run(g,'ll1','a').error,/not LL\(1\)/);
 assert.equal(run(g,'rd','a').ok,true);
});
test('epsilon and factoring are computed by backend',()=>{
 const nullable=prepareGrammar('S -> a S | ε');
 assert.equal(run(nullable,'ll1','').ok,true);
 const factored=prepareGrammar('S -> a b | a c');
 assert.match(factored.fixed,/S'/);
 assert.equal(run(factored,'rd','ab').ok,true);
});
test('invalid grammars and unknown symbols return original errors',()=>{
 assert.throws(()=>prepareGrammar('not a rule'),/Invalid rule/);
 const g=prepareGrammar('S -> a');assert.throws(()=>run(g,'ll1','z'),/Unknown symbol/);
});
test('HTTP API returns real normalized results and proper invalid response',async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  const root=`http://127.0.0.1:${server.address().port}`;
  const health=await fetch(root+'/api/health').then(r=>r.json());assert.equal(health.ok,true);
  const ex=await fetch(root+'/api/examples').then(r=>r.json());assert.equal(ex.examples.length,EXAMPLES.length);
  const body={grammar:'S -> a A\nA -> b | ε',mode:'ll1',input:'a b'};
  const response=await fetch(root+'/api/simulate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  assert.equal(response.status,200);const result=await response.json();assert.equal(result.ok,true);
  assert.equal(result.simulation.ok,true);assert.equal(result.simulation.steps.at(-1).action,'Accept');
  assert.deepEqual(result.grammar.info.first.A,['b','ε']);
  const err=await fetch(root+'/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({grammar:'not a rule'})});assert.equal(err.status,422);
  const page=await fetch(root+'/');assert.equal(page.status,200);assert.match(await page.text(),/ParseLab/);
 } finally {await new Promise(r=>server.close(r));}
});
