'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {Worker}=require('node:worker_threads');
const PUBLIC=path.join(__dirname,'public');
const PORT=Number(process.env.PORT||4173);
const MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json; charset=utf-8'};
const EXAMPLES=[
  {id:'arithmetic',name:'Arithmetic expressions · left recursion',grammar:'E -> E + T | T\nT -> T * F | F\nF -> ( E ) | id',input:'id + id * id',description:'See automatic preprocessing and both parsing techniques.'},
  {id:'simple',name:'Simple predictive grammar',grammar:'S -> a A\nA -> b | ε',input:'a b',description:'Small grammar with an optional ending.'},
  {id:'epsilon',name:'Nullable / epsilon grammar',grammar:'S -> a S | ε',input:'a a a',description:'A recursive grammar that can produce the empty string.'},
  {id:'factoring',name:'Common-prefix factoring',grammar:'S -> a b | a c',input:'a b',description:'Watch the backend factor a shared prefix.'},
  {id:'conflict',name:'LL(1) conflict',grammar:'S -> A | B\nA -> a\nB -> a',input:'a',description:'An unfactorable predictive-table conflict. Recursive Descent remains available.'},
  {id:'parenthesis',name:'Balanced parentheses',grammar:'S -> ( S ) S | ε',input:'( ( ) )',description:'Nested recursive derivation with epsilon.'}
];
function json(res,status,obj){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(obj));}
function compute(payload){return new Promise(resolve=>{
  const worker=new Worker(path.join(__dirname,'worker.js'),{workerData:payload});
  let finished=false;
  const settle=v=>{if(finished)return;finished=true;clearTimeout(watch);resolve(v);worker.terminate();};
  const watch=setTimeout(()=>settle({ok:false,error:'Processing exceeded the 3-second safety limit. Try a simpler grammar.'}),3000);
  worker.on('message',settle);worker.on('error',e=>settle({ok:false,error:`Worker failed: ${e.message}`}));worker.on('exit',code=>{if(code!==0)settle({ok:false,error:'Parser worker exited unexpectedly.'});});
});}
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/health'&&req.method==='GET')return json(res,200,{ok:true,engine:'Original Node.js parser backend',version:'1.0.0'});
  if(url.pathname==='/api/examples'&&req.method==='GET')return json(res,200,{ok:true,examples:EXAMPLES});
  if(url.pathname.startsWith('/api/')){
    if(!['/api/analyze','/api/simulate'].includes(url.pathname)||req.method!=='POST')return json(res,404,{ok:false,error:'Unknown endpoint.'});
    let data='';let tooLarge=false;
    try{
      for await (const chunk of req){data+=chunk;if(data.length>12_000){tooLarge=true;break;}}
      if(tooLarge)return json(res,413,{ok:false,error:'Request too large. Maximum 12 KB.'});
      const body=JSON.parse(data);
      if(typeof body.grammar!=='string'||!body.grammar.trim()||body.grammar.length>6000)return json(res,400,{ok:false,error:'Provide a nonempty grammar of at most 6,000 characters.'});
      if(url.pathname==='/api/simulate'&&(typeof body.input!=='string'||body.input.length>2000||!['rd','ll1'].includes(body.mode)))return json(res,400,{ok:false,error:'Provide an input string (max 2,000 characters) and a valid parser mode.'});
      const result=await compute({action:url.pathname==='/api/analyze'?'analyze':'simulate',grammar:body.grammar,input:body.input,mode:body.mode});
      return json(res,result.ok?200:422,result);
    }catch(e){return json(res,400,{ok:false,error:e instanceof SyntaxError?'Invalid JSON request.':'Could not process request.'});}
  }
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end();}
  const files={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/styles.css':'styles.css','/content.js':'content.js','/favicon.svg':'favicon.svg'};
  const target=files[url.pathname];
  if(!target){res.writeHead(404);return res.end('Not found');}
  const full=path.join(PUBLIC,target);
  try{res.writeHead(200,{'Content-Type':MIME[path.extname(target)],'X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});if(req.method==='HEAD')return res.end();fs.createReadStream(full).pipe(res);}
  catch(e){res.writeHead(404);res.end('Not found');}
});
if(require.main===module){server.listen(PORT,()=>console.log(`Top-Down Studio: http://localhost:${PORT}`));}
module.exports={server,compute,EXAMPLES};
