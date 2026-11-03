'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/content.js'),'utf8'),ctx);
const lib=ctx.window.LIBRARY;
test('concept library has unique identifiers and meaningful learning fields',()=>{
 assert.ok(lib.lessons.length>=25);
 assert.equal(new Set(lib.lessons.map(x=>x.id)).size,lib.lessons.length);
 for(const l of lib.lessons){assert.ok(l.summary.length>20);assert.ok(l.steps.length>=3);assert.ok(l.example.length>0);for(const id of [...l.related,...l.prereq])assert.ok(lib.byId[id],`${l.id}: missing ${id}`);}
});
test('tree nodes reference real lessons and are all reachable',()=>{
 const ids=[];function visit(n){ids.push(n.id);assert.ok(lib.byId[n.id]);for(const c of n.children||[])visit(c);}visit(lib.tree);
 assert.equal(new Set(ids).size,ids.length);
 assert.equal(ids.length,lib.lessons.length);
});
test('each flowchart has meaningful stages and valid node types',()=>{
 assert.ok(Object.keys(lib.flows).length>=10);
 for(const f of Object.values(lib.flows)){
  assert.ok(f.stages.length>=4);
  assert.equal(f.stages[0].type,'start');assert.equal(f.stages.at(-1).type,'end');
  for(const s of f.stages)assert.ok(['start','end','process','decision'].includes(s.type));
 }
});
test('glossary and quizzes link to real lesson IDs',()=>{
 assert.ok(lib.glossary.length>=20);assert.ok(lib.questions.length>=15);
 for(const t of lib.glossary)assert.ok(lib.byId[t.id]);
 for(const q of lib.questions){assert.ok(lib.byId[q.lesson]);assert.ok(q.correct>=0&&q.correct<q.choices.length);}
});
