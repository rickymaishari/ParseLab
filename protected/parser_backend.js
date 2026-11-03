/*Top-Down Parser Simulator - Backend (Recursive Descent + LL(1))

   Grammar format (one rule per line, symbols separated by spaces):
       E -> E + T | T
       T -> T * F | F
       F -> ( E ) | id
   Epsilon can be written as: ε  eps  epsilon  #  λ   (first rule = start symbol)
*/

const EPS_WORDS = ['ε', 'eps', 'epsilon', '#', 'λ'];

function parseGrammar(text) {
  const rules = {}, order = [];
  for (const line of text.split('\n').map(l => l.trim()).filter(Boolean)) {
    const [lhs, rhs] = line.split(/->|→|::=/);
    if (rhs === undefined || !lhs.trim()) throw new Error(`Invalid rule: "${line}"`);
    const A = lhs.trim();
    if (!rules[A]) { rules[A] = []; order.push(A); }
    rhs.split('|').forEach(alt => rules[A].push(alt.trim()));
  }
  if (!order.length) throw new Error('Grammar is empty');
  // turn each alternative (string) into an array of symbols; [] means epsilon
  for (const A of order) {
    const seen = new Set();
    rules[A] = rules[A].map(alt => splitSymbols(alt, rules)).filter(p => {
      const k = p.join(' '); return seen.has(k) ? false : seen.add(k);
    });
  }
  return { start: order[0], rules, order };
}

function splitSymbols(alt, rules) {
  if (alt === '' || EPS_WORDS.includes(alt)) return [];
  const parts = alt.split(/\s+/);
  if (parts.length > 1 || rules[alt]) return parts;
  const nts = Object.keys(rules).sort((a, b) => b.length - a.length);
  const out = []; let s = alt, found = false;
  while (s) {
    const nt = nts.find(n => s.startsWith(n));
    if (nt) { out.push(nt); s = s.slice(nt.length); found = true; }
    else { out.push(s[0]); s = s.slice(1); }
  }
  return found ? out : [alt];
}

const fresh = (g, A) => { let n = A + "'"; while (n in g.rules) n += "'"; g.rules[n] = []; return n; };
const clone = g => JSON.parse(JSON.stringify(g));
const show = g => g.order.map(A => `${A} -> ${g.rules[A].map(p => p.join(' ') || 'ε').join(' | ')}`).join('\n');

/*removing left recursion (direct & indirect)*/
function removeLeftRecursion(g) {
  const { rules, order } = g, n = order.length;
  for (let i = 0; i < n; i++) {
    const Ai = order[i];
    for (let j = 0; j < i; j++) {
      const Aj = order[j];
      rules[Ai] = rules[Ai].flatMap(p => p[0] === Aj ? rules[Aj].map(d => [...d, ...p.slice(1)]) : [p]);
    }
    const rec = rules[Ai].filter(p => p[0] === Ai && p.length > 1);
    const non = rules[Ai].filter(p => p[0] !== Ai);
    if (!rec.length) { rules[Ai] = non; continue; }
    if (!non.length) throw new Error(`${Ai} is left-recursive with no base case (non-productive)`);
    const A2 = fresh(g, Ai);
    rules[Ai] = non.map(b => [...b, A2]);                      // A  -> β A'
    rules[A2] = [...rec.map(p => [...p.slice(1), A2]), []];    // A' -> α A' | ε
    order.push(A2);
  }
}

/*remove left factoring (until no common prefix)*/
function leftFactor(g) {
  for (let changed = true; changed;) {
    changed = false;
    for (const A of [...g.order]) {
      const groups = {};
      g.rules[A].forEach(p => p.length && (groups[p[0]] ??= []).push(p));
      const dup = Object.values(groups).find(x => x.length > 1);
      if (!dup) continue;
      let k = 1;                                                //longest common prefix length
      while (dup.every(p => p[k] !== undefined && p[k] === dup[0][k])) k++;
      const A2 = fresh(g, A);
      g.rules[A] = [...g.rules[A].filter(p => !dup.includes(p)), [...dup[0].slice(0, k), A2]];
      g.rules[A2] = dup.map(p => p.slice(k));
      g.order.push(A2);
      changed = true;
    }
  }
}

/*FIRST, FOLLOW, LL(1) table*/
function analyze(g) {
  const { rules, order, start } = g, isNT = s => s in rules;
  const first = {}, follow = {};
  order.forEach(A => { first[A] = new Set(); follow[A] = new Set(); });

  const firstSeq = seq => {
    const r = new Set();
    for (const s of seq) {
      if (!isNT(s)) { r.add(s); return r; }
      first[s].forEach(x => x !== 'ε' && r.add(x));
      if (!first[s].has('ε')) return r;
    }
    r.add('ε'); return r;
  };
  const grow = (set, items) => { let c = false; items.forEach(x => { if (!set.has(x)) { set.add(x); c = true; } }); return c; };

  for (let ch = true; ch;) { ch = false;
    for (const A of order) for (const p of rules[A]) ch = grow(first[A], firstSeq(p)) || ch; }

  follow[start].add('$');
  for (let ch = true; ch;) { ch = false;
    for (const A of order) for (const p of rules[A]) p.forEach((s, i) => {
      if (!isNT(s)) return;
      const f = firstSeq(p.slice(i + 1));
      const add = [...f].filter(x => x !== 'ε');
      if (f.has('ε')) add.push(...follow[A]);
      ch = grow(follow[s], add) || ch;
    }); }

  const table = {}, conflicts = [];
  for (const A of order) {
    table[A] = {};
    for (const p of rules[A]) {
      const f = firstSeq(p), ts = [...f].filter(x => x !== 'ε');
      if (f.has('ε')) ts.push(...follow[A]);
      ts.forEach(t => (table[A][t] ??= []).push(p));
    }
    for (const t in table[A]) if (table[A][t].length > 1)
      conflicts.push(`M[${A}, ${t}] has ${table[A][t].length} entries: ` +
        table[A][t].map(p => `${A} -> ${p.join(' ') || 'ε'}`).join('  |  '));
  }
  return { first, follow, table, conflicts };
}

/*Main entry: fix the grammar, then analyse*/
function prepareGrammar(text) {
  const g = parseGrammar(text);
  const original = show(g);
  removeLeftRecursion(g);
  leftFactor(g);
  g.original = original;
  g.fixed = show(g);
  g.terminals = new Set(Object.values(g.rules).flat(2).filter(s => !(s in g.rules)));
  g.info = analyze(g);
  return g;
}

function tokenize(s, g) {
  s = s.trim();
  if (!s) return [];
  if (/\s/.test(s)) return s.split(/\s+/);
  const T = [...g.terminals].sort((a, b) => b.length - a.length), out = [];
  while (s) {
    const t = T.find(t => s.startsWith(t));
    if (!t) throw new Error(`Unknown symbol near "${s}"`);
    out.push(t); s = s.slice(t.length);
  }
  return out;
}

/*LL(1) predictive parser*/
function runLL1(g, input) {
  if (g.info.conflicts.length)
    return { ok: false, error: 'Grammar is not LL(1):\n' + g.info.conflicts.join('\n') + '\nTry the Recursive Descent (backtracking) parser instead.' };
  const toks = [...tokenize(input, g), '$'], steps = [];
  const root = { sym: g.start, children: [] }, stack = [{ sym: '$' }, root];
  let i = 0;
  const row = action => steps.push({ stack: stack.map(n => n.sym).join(' '), input: toks.slice(i).join(' '), action });

  for (;;) {
    const top = stack[stack.length - 1], a = toks[i];
    if (top.sym === '$') { row(a === '$' ? 'Accept' : `Error: extra input "${a}"`); return { ok: a === '$', steps, tree: root }; }
    if (!(top.sym in g.rules)) {
      if (top.sym !== a) { row(`Error: expected "${top.sym}", found "${a}"`); return { ok: false, steps, tree: root }; }
      row(`Match ${a}`); stack.pop(); i++;
    } else {
      const p = g.info.table[top.sym][a]?.[0];
      if (!p) { row(`Error: no rule for M[${top.sym}, ${a}]`); return { ok: false, steps, tree: root }; }
      row(`${top.sym} -> ${p.join(' ') || 'ε'}`);
      stack.pop();
      const kids = p.map(s => ({ sym: s, children: [] }));
      top.children = kids.length ? kids : [{ sym: 'ε', children: [] }];
      stack.push(...[...kids].reverse());
    }
  }
}

/*recursive descent parser (with backtracking)*/
function runRD(g, input) {
  const toks = tokenize(input, g), trace = [];
  const log = (d, m) => { if (trace.length > 5000) throw new Error('Too many steps (possible infinite recursion)'); trace.push('  '.repeat(d) + m); };
  const fmt = (A, p) => `${A} -> ${p.join(' ') || 'ε'}`;

  const rd = (sym, pos, d, k) => {
    if (!(sym in g.rules)) {          
      if (toks[pos] !== sym) { log(d, `expected '${sym}', found '${toks[pos] ?? '$'}'`); return null; }
      log(d, `match '${sym}'`);
      const r = k(pos + 1, { sym, children: [] });
      if (!r) log(d, `un-match '${sym}' (backtrack)`);
      return r;
    }
    for (const p of g.rules[sym]) {                               
      log(d, `call ${sym}()  trying ${fmt(sym, p)}`);
      const r = seq(p, 0, pos, [], d + 1, (q, ch) => k(q, { sym, children: ch.length ? ch : [{ sym: 'ε', children: [] }] }));
      if (r) return r;
      log(d, `backtrack: ${fmt(sym, p)} failed`);
    }
    return null;
  };
  const seq = (p, i, pos, ch, d, k) =>
    i === p.length ? k(pos, ch) : rd(p[i], pos, d, (q, n) => seq(p, i + 1, q, [...ch, n], d, k));

  try {
    const tree = rd(g.start, 0, 0, (q, n) => q === toks.length ? n : null);
    return { ok: !!tree, trace, tree };
  } catch (e) { return { ok: false, trace, error: e.message }; }
}

/*Dispatcher used by the UI*/
function run(g, parser, input) {
  return parser === 'rd' ? runRD(g, input) : runLL1(g, input);   // parser: 'rd' | 'll1'
}

if (typeof module !== 'undefined') module.exports = { prepareGrammar, run, runLL1, runRD, tokenize };
