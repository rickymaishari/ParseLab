# College demonstration: ~4 minutes, three presenters

## Moksha — context and problem (~60 seconds)

“Good morning. Our project is called **Simulation of Top-Down Parsers**. Parsing is the compiler phase that checks source-code syntax using grammar rules, but textbook explanations alone can make recursive calls and predictive table selection difficult to visualize.

We built **ParseLab**, an interactive learning environment where you can begin from an expandable knowledge map, study the grammar concepts, click through flowcharts, and then run the actual parsing algorithms. The goal is to make the journey from theory to a real parse much clearer.

I’ll open the knowledge map, expand Top-down Parsing, and select FIRST sets. Notice that the meaning of the concept appears beside the map and connects directly to its lesson and practical tools. Ricky will now demonstrate the real engine.”

## Ricky — scope, simulation and implementation (~90 seconds)

“Our project implements two parsing methods: **Recursive Descent with backtracking** and **LL(1) Predictive Parsing**. The important point is that we have **not changed our original backend**. Both original JavaScript files are preserved, and a separate Node integration layer calls their existing `prepareGrammar()` and `run()` functions.

I’ll open the Simulator. We enter an expression grammar containing left recursion and choose an input like `id + id * id`. The backend automatically removes left recursion and left factors, computes FIRST/FOLLOW, and builds a predictive table. We can inspect the original and transformed grammar side by side.

Next I’ll run LL(1): here are the real stack, remaining input, and production applied on every step. The table shows which production is selected, and the backend also returns a parse tree. Switching to Recursive Descent uses the same backend grammar, but now we can study function calls, matches and backtracking.

Finally, I’ll load our conflict grammar. The LL(1) mode correctly reports a conflict, whereas Recursive Descent can still be attempted. Kashish will cover implementation tools and student learning features.”

## Kashish — tools, features and conclusion (~60 seconds)

“We used **HTML, CSS and JavaScript** for the responsive frontend, and **Node.js** for the server-side integration. Our existing parser algorithms run in an isolated worker without being rewritten; the original CLI also remains usable separately.

Besides the simulator, ParseLab includes clickable algorithm flowcharts, grammar transformation exercises, concept lessons, quizzes with instant explanations, a searchable glossary, and viva revision questions. The same concepts are linked throughout the platform so students can move between understanding and experimentation.

For quality verification, we tested real backend acceptance and rejection, FIRST/FOLLOW, LL(1) conflicts, grammar transformations, errors and file integrity. Our goal is a technically correct and engaging way to study top-down parsing rather than simply reading results. Thank you.”

## Suggested demo order

1. Overview → Knowledge Map → expand a branch → select FIRST sets.
2. Open FIRST lesson → Interactive flowchart → Next stage.
3. Simulator → Arithmetic example → Run LL(1) → Trace → Parsing Table → Parse Tree.
4. Change mode to Recursive Descent → Run → show backtracking trace.
5. Load Conflict example → Run LL(1) → explain conflict → Run Recursive Descent.
6. Practice → answer one question → Glossary → select a term.

## Fast viva answers

**Why LL(1)?** Left-to-right scan, leftmost derivation, one lookahead; table entries choose productions without backtracking.

**FIRST vs FOLLOW?** FIRST collects possible starting tokens for a derivation; FOLLOW collects tokens that can come immediately after a non-terminal.

**What is nullable?** A non-terminal that can derive ε. It affects FIRST and when FOLLOW is used to place table entries.

**Why remove left recursion?** It can cause a naïve top-down parser to recurse without consuming input.

**What does left factoring do?** Extracts common prefixes into helper non-terminals, delaying decisions until tokens distinguish alternatives.

**What are LL(1) conflicts?** Multiple productions in the same table cell. One lookahead cannot choose uniquely; this alone does not prove ambiguity.

**How is the backend protected?** The original parser and CLI are copied unchanged; hashes are verified by automated tests. The new worker calls existing exported functions.

**Does your parser generate a real parse tree?** Yes. Both parsers return a `tree` on success, and the website visualizes the actual returned structure. LL(1) failure can return a partial tree.

**What is the main limitation?** The original backend does not expose intermediate transformation snapshots or RD runtime stack snapshots. We do not invent these states.
