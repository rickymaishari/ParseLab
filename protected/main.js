const readline = require('readline');
const { prepareGrammar, run } = require('./parser_backend');

/*multi-line input*/
const rl = readline.createInterface({ input: process.stdin });
const queue = [], waiters = [];
let closed = false;
rl.on('line', l => (waiters.length ? waiters.shift()(l) : queue.push(l)));
rl.on('close', () => { closed = true; waiters.splice(0).forEach(w => w(null)); });

function ask(prompt) {
  process.stdout.write(prompt);
  return new Promise(res => {
    if (queue.length) res(queue.shift());
    else if (closed) res(null);
    else waiters.push(res);
  });
}

const setStr = s => '{ ' + [...s].join(', ') + ' }';

function printGrammar(g) {
  console.log('\n=== ORIGINAL GRAMMAR ===');
  console.log(g.original);
  console.log('\n=== GRAMMAR AFTER REMOVING LEFT RECURSION & LEFT FACTORING ===');
  console.log(g.fixed);
}

function printFirstFollow(g) {
  const { first, follow } = g.info;
  console.log('\n=== FIRST / FOLLOW ===');
  for (const A of g.order) console.log(`FIRST(${A}) = ${setStr(first[A])}`);
  console.log('');
  for (const A of g.order) console.log(`FOLLOW(${A}) = ${setStr(follow[A])}`);
}

function printTable(g) {
  const cols = [...g.terminals, '$'];
  const view = {};
  for (const A of g.order) {
    view[A] = {};
    for (const t of cols) {
      const cell = g.info.table[A][t];
      view[A][t] = cell ? cell.map(p => p.join(' ') || 'ε').join('  /  ') : '';
    }
  }
  console.log('\n=== LL(1) PARSING TABLE ===');
  console.table(view);
}

/*reading the grammar*/
async function readGrammar() {
  console.log('\nEnter grammar, one rule per line (e.g.  E -> E + T | T ). Use ε / eps / # for epsilon.');
  console.log('First rule = start symbol. Press ENTER on an empty line when done.');
  while (true) {
    const lines = [];
    while (true) {
      const line = await ask('→ ');
      if (line === null) return null;
      if (line.trim() === '') break;
      lines.push(line);
    }
    if (!lines.length) { console.log('Grammar is empty, try again.'); continue; }
    try {
      return prepareGrammar(lines.join('\n'));
    } catch (e) {
      console.log('Error: ' + e.message + '\nPlease enter the grammar again.');
    }
  }
}

/* parsing loops */
async function parseLoop(g, mode) {
  while (true) {
    const input = await ask('\nEnter input string (empty line = back to menu): ');
    if (input === null || input.trim() === '') return;
    try {
      const res = run(g, mode, input);
      if (res.error) console.log(res.error);
      if (mode === 'll1' && res.steps) console.table(res.steps);
      if (mode === 'rd' && res.trace) console.log(res.trace.join('\n'));
      if (!res.error) console.log(res.ok ? '\n>>> ACCEPTED' : '\n>>> REJECTED');
    } catch (e) {
      console.log('Error: ' + e.message);
    }
  }
}


async function main() {
  while (true) {                                    
    const g = await readGrammar();                 
    if (!g) break;
    printGrammar(g);                                
    printFirstFollow(g);                            

    const conflicts = g.info.conflicts;             
    if (conflicts.length) {
      console.log('\nGrammar is NOT LL(1):');
      conflicts.forEach(c => console.log('  ' + c));
    } else {
      console.log('\nNo conflicts: grammar is LL(1).');
    }

    let newGrammar = false;
    while (!newGrammar) {                           
      console.log('\nWhich parser do you want to use?');
      console.log('  1) Recursive Descent Parser');
      console.log('  2) LL(1) / Predictive Parser');
      console.log('  3) Enter a new grammar');
      console.log('  4) Exit');
      const choice = await ask('Choice: ');
      if (choice === null) { rl.close(); return; }

      switch (choice.trim()) {
        case '1':
          await parseLoop(g, 'rd');                 // backtracking, works even if not LL(1)
          break;
        case '2':
          if (conflicts.length) {
            console.log("Grammar is not LL(1), so the predictive parser can't be used.");
            break;
          }
          printTable(g);                            
          await parseLoop(g, 'll1');
          break;
        case '3': newGrammar = true; break;
        case '4': rl.close(); return;
        default:  console.log('Invalid choice, enter 1-4.');
      }
    }
  }
  rl.close();
}

main();