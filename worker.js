'use strict';
// Isolated adapter ONLY. Original parser algorithms remain inside protected/parser_backend.js.
const {parentPort, workerData} = require('node:worker_threads');
const {prepareGrammar, run} = require('./protected/parser_backend');
const normalize = g => ({
  start:g.start, original:g.original, fixed:g.fixed, order:g.order,
  rules:g.rules, terminals:[...g.terminals],
  info:{
    first:Object.fromEntries(Object.entries(g.info.first).map(([k,v])=>[k,[...v]])),
    follow:Object.fromEntries(Object.entries(g.info.follow).map(([k,v])=>[k,[...v]])),
    table:g.info.table, conflicts:g.info.conflicts
  }
});
try {
  const {action, grammar, mode, input}=workerData;
  const g=prepareGrammar(grammar);
  const prepared=normalize(g);
  if(action==='analyze') parentPort.postMessage({ok:true,grammar:prepared});
  else if(action==='simulate') {
    if(!['rd','ll1'].includes(mode)) throw new Error('Choose Recursive Descent or LL(1).');
    const simulation=run(g,mode,input);
    parentPort.postMessage({ok:true,grammar:prepared,simulation});
  } else throw new Error('Unsupported action.');
} catch(err) {parentPort.postMessage({ok:false,error:err.message||'Unable to process grammar.'});}
