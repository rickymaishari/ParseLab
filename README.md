# ParseLab — Simulation of Top-Down Parsers

**A complete no-dependency web application built around the original, unmodified student backend.**

Program: B.Tech Computer Science & Business Systems | Compiler Design mini-project

Team: Moksha Jain, Ricky Maishari, Kashish Jain

## Quick start (Windows, macOS, Linux)

1. Install **Node.js 18 or later**. Node.js 22 is recommended.
2. Clone or download this repository and open a terminal in the project folder.
3. Run:

   ```bash
   npm start
   ```

4. Open **http://localhost:4173** in Chrome, Edge, Safari, or Firefox.
5. Select **Parser Simulator → Run Simulation** to see the bundled arithmetic-expression example running on the actual backend.

**No `npm install` is necessary**: the project uses only built-in Node.js modules, HTML, CSS, and JavaScript. Google Fonts are optional; system fonts are used if the network is unavailable.

Other commands:

```bash
npm test                  # Runs the regression, integration and UI-view-model test suite
npm run cli               # Original CLI interaction from protected/main.js
# macOS/Linux: PORT=5000 npm start
# Windows PowerShell: $env:PORT=5000; npm start
```

If port 4173 is taken, set the `PORT` environment variable and restart.

## Backend protection / integration guarantee

Both uploaded backend files are copied *byte for byte* without modifying their logic:

| Original uploaded file | Protected copy | SHA-256 |
|---|---|---|
| `parser_backend.js` | `protected/parser_backend.js` | `68f8f9ca036d6c8318bf94ddb94e5e7b1c9b7c114967682aba2f225183eb69d9` |
| `main.js` | `protected/main.js` | `7ce22372b2b77a2347d86f5b020dee8c80ae07dac58546a1726fb2ab2f4ab0b8` |

The new website does **not** execute the interactive CLI inside a browser. `main.js` remains the independent command-line front-end and still invokes the same parser backend. The new `server.js`/`worker.js` are a **separate HTTP integration entry point**, directly calling `prepareGrammar()` and `run()` from `protected/parser_backend.js`. `worker.js` serializes `Set` values for the browser without changing algorithm outputs. Real grammar transformations, FIRST/FOLLOW sets, predictive tables, conflicts, trace events, and parse trees are provided by these exported functions.

### Architecture

```text
Browser UI (public/index.html, styles.css, content.js, app.js)
                 |
                 | HTTP POST /api/analyze or /api/simulate
                 v
         server.js (Node HTTP server)
                 |
                 | Node worker_threads + 3-second safety deadline
                 v
     worker.js (thin serialization adapter)
                 |
                 | prepareGrammar(grammar); run(g, mode, input)
                 v
   protected/parser_backend.js  <— ORIGINAL, UNMODIFIED

   protected/main.js — ORIGINAL, UNMODIFIED CLI, runs separately
```

**Important:** Both parsers run against the preprocessed grammar, not the input grammar. That is how the original `prepareGrammar()` function works. The UI explicitly displays the original and transformed grammar.

## Features delivered

- **Polished responsive interface:** dark navy/cyan design, optional light mode, sidebar navigation, cards, loading/error/empty states, keyboard-focus styles, reduced-motion rules and responsive CSS.
- **Interactive knowledge tree:** hierarchy of 25 connected topics, click-to-select inspector, branch expand/collapse, expand all, collapse all, reset, topic search that reveals ancestors, zoom, scroll/pan, return-to-map context retention.
- **Clickable flowcharts:** eleven guided conceptual algorithm diagrams, decision labels, side-by-side stage inspector, previous/next/reset/autoplay and links to lessons/simulator. *These are teaching diagrams; they are not mislabelled as a backend trace.*
- **Educational lessons:** 25 concepts with definitions, importance, examples, steps, mistakes, related concepts, prerequisites and deep links to practical tools.
- **Grammar lab:** before/after grammar transformation, FIRST/FOLLOW and LL(1) table for the exact supplied input, plus curated left recursion, factoring, nullable, FIRST, FOLLOW and conflict exercises.
- **Live simulator:** edit a multiline CFG, edit tokens, choose Recursive Descent or LL(1), load one of six verified examples, run either parser, view real parsing outcome, traces, FIRST/FOLLOW and table conflicts.
- **LL(1) trace player:** synchronized stack/input/action viewer, step list, playback controls and current predictive-table cell highlighting for expansion steps.
- **Recursive Descent trace player:** actual backend messages for calls, token matches, expectation failures and backtracking.
- **Real parse trees:** display a nested diagram from the actual `tree` result. Rejection may produce a partial LL(1) tree. No invented derivations.
- **Glossary and viva revision:** 21 clickable glossary terms, explanatory examples, 10 expandable viva questions, printer-friendly view.
- **Practice:** 18 quizzes, three levels, answers with immediate rationale, score/progress computed from real local quiz state.
- **Search:** site-wide search over lessons and glossary definitions.
- **Result export:** download the actual analysis and simulation response in JSON.

### Available HTTP routes

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/examples` | Verified sample grammars |
| POST | `/api/analyze` | `{ "grammar": "S -> a" }` |
| POST | `/api/simulate` | `{ "grammar": "S -> a", "input": "a", "mode": "ll1" }` |

Malformed grammar: HTTP 422 with an error string. Syntactically invalid HTTP payload: HTTP 400. The response distinguishes API success (`ok: true` at top level) from the **parser's** acceptance (`simulation.ok`). A rejected input can produce a successful API response with `simulation.ok: false`. Conflict errors are returned by the original LL(1) function. Input size and worker runtime are bounded at the API layer.

## Testing and verification

`npm test` covers:

- Identical SHA-256 checksums of both protected originals.
- Original CLI launch, grammar reading and menu.
- Recursive Descent acceptance, rejection, and real parse-tree/trace return values.
- LL(1) acceptance, rejection, real table stack trace and tree.
- Left-recursion removal, FIRST/FOLLOW results, epsilon, left factoring.
- Conflict grammars and backend errors.
- HTTP health, examples, analyze, simulate, malformed input, static page delivery.
- Concept-data internal linking, full tree reachability, complete flow stages and quiz references.
- JavaScript UI view rendering/navigation, tree expansion, lesson deep linking, interactive flow selection, quiz feedback and glossary details, run under a mocked DOM in Node.

**Testing limitation:** Automated real-browser visual/E2E screenshots could not be executed in the authoring environment because Chromium navigation to even local addresses was blocked by administrator policy. The JS entry points passed syntax checking and scripted view-model checks, but real device/mobile layout and keyboard behavior still need final visual checking on your own machine.

### Basic manual acceptance checklist

1. Start the server; verify the side panel shows **Parser engine connected**.
2. On **Knowledge Map**, expand Top-down parsing, select FIRST sets, open its full lesson, and return to map. Confirm the branch is still expanded.
3. On **Flowcharts**, select LL(1), click steps, try Previous/Next/Play and verify side explanations change.
4. On **Simulator**, load Arithmetic expressions, run LL(1), step through trace, open Table and Tree.
5. Switch to Recursive Descent, rerun, and examine real call/backtrack lines.
6. Load Conflict example; LL(1) must refuse to run predictively; Recursive Descent can still be tried.
7. Edit the grammar; ensure the previous result is cleared rather than shown as current.
8. Use Practice, Glossary, theme toggle and Search; verify mobile navigation and horizontal table scrolling.
9. Run `npm test` and compare hashes with `integrity.json`.

## Verified demonstration example

```text
E -> E + T | T
T -> T * F | F
F -> ( E ) | id
```

Input: `id + id * id`.

The original parser transforms that grammar, finds no LL(1) conflicts in the transformed grammar, and **accepts** the input with both parser modes. The LL(1) run returns 17 real stack/input/action rows. The Recursive Descent mode shows the original trace messages and an accepted parse tree.

For conflict demonstration:

```text
S -> A | B
A -> a
B -> a
```

Input: `a`. The transformed grammar retains a conflict in `M[S,a]`; LL(1) returns its built-in conflict error, while Recursive Descent accepts.

## Known limitations and honest boundaries

- Original backend accepts CFG rules with arrow `->`, `→`, or `::=`; it also supports `ε`, `eps`, `epsilon`, `#`, and `λ`, and uses the first rule as the start symbol. Tokenization behavior is exactly as supplied, including its limitations for some mixed or long unspaced tokens.
- Original backend's transformations handle direct and certain indirect recursion and first-symbol left factoring, but this is **not** a promise that arbitrary grammars work. Some grammars remain conflicted or trigger a backend exception/time limit.
- The backend computes nullability as part of FIRST sequence analysis but does not export a standalone nullable-set structure. The nullable flowchart is **teaching-only**.
- The original backend does not return the intermediate states of removal/factoring, so before/after grammars are shown, **not fabricated intermediate algorithm traces**.
- The backend exports an LL(1) step trace and a Recursive Descent text trace; the latter is **not** a snapshot of an actual runtime call stack. Trace players display exactly what is exposed.
- The tree is created from the `tree` object returned by the parser. For rejected LL(1) inputs it may be partial. Recursive Descent failure may not provide a tree.
- Flowcharts illustrate correct conceptual logic but are not executable graph programs or live traces.
- The application deliberately has no user database, fake login, or fake progress persistence. Quiz progress is held only in the open page session. Theme preference is optionally stored in browser localStorage.
- The web UI requires the Node server. Opening `public/index.html` directly from the file system will not connect to parser logic.
- For production internet deployment, add application-level rate limits, operational monitoring, hardened web-server security headers, and a restricted deployment environment. This is designed for local academic demonstration.

## Files

```text
ParseLab/
  protected/
    main.js             # ORIGINAL CLI (never edited)
    parser_backend.js   # ORIGINAL parser algorithms (never edited)
  public/
    index.html          # Web page shell
    styles.css          # Responsive design system
    app.js              # Connected UI and interactions
    content.js          # Data-driven teaching content / knowledge tree / quizzes
    favicon.svg
  server.js             # NEW separate Node HTTP adapter
  worker.js             # NEW isolated caller / result serializer
  tests/                # Original-backend integrity, API, content and UI model tests
  docs/
    DEMO_AND_VIVA.md
    FEATURES_AND_SCOPE.md
  integrity.json        # Immutable upload checksums
  package.json
  README.md
```

## References

- The original source files are present in `protected/`.
- The backend and educational terminology follow the supplied source and its exposed behavior. The project uses no third-party JS runtime libraries.

