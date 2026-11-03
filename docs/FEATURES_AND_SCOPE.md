# Implemented / partial / future feature checklist

The supplied master prompt is ambitious. This checklist distinguishes current implementation from improvements that would require additional work. All live parsing results come from the unchanged backend.

| Capability | Status | Notes |
|---|---|---|
| Original parser logic protected | Implemented | SHA-256 comparison against both uploaded originals |
| Original CLI preserved | Implemented | `npm run cli` |
| Live API for both parser modes | Implemented | Worker calls original `prepareGrammar` and `run` |
| Grammar transformations | Implemented | Actual original and final transformed grammar |
| FIRST/FOLLOW sets and LL(1) table | Implemented | Original backend data |
| Conflict reporting | Implemented | Real `g.info.conflicts` and LL(1) rejection |
| Live RD trace and LL(1) trace | Implemented | From actual backend responses |
| Real parse tree visualization | Implemented | Nested HTML generated from returned tree object |
| LL(1) step playback and table-cell highlighting | Implemented | Based on backend trace data |
| Branching knowledge tree | Implemented | 25 curriculum nodes; expand/collapse, inspector, search, zoom |
| Map panning | Implemented | Scrolling overflow area; no drag-to-pan |
| Tree location persistence during same-page navigation | Implemented | UI state maintained until reload |
| Guided beginner path | Partial | Ordered lesson sequence and suggested next lessons; no adaptive skill tracking |
| Concept library | Implemented | 25 linked concept articles with steps and examples |
| Clickable flowcharts | Implemented | 11 conceptual flows with staged inspector and playback |
| Dedicated branching diagram geometry | Partial | Decision diamonds and outcome labels; no editable node-edge canvas or graphical alternate routes |
| Grammar laboratories | Implemented | Backend-driven before/after plus FIRST/FOLLOW and table; curated examples |
| Intermediate transformations | Not available from backend | No fake intermediate algorithm logs |
| Standalone backend nullable set | Not available from backend | Explained conceptually and observable via FIRST ε |
| Glossary | Implemented | 21 searchable terms and contextual details |
| Quizzes and viva | Implemented | 18 scored practice questions, 10 viva answers |
| Global concept search | Implemented | Searches concepts and glossary |
| Theme toggle | Implemented | Persists in localStorage if available |
| Real user progress persistence | Not implemented | No fake completion indicators |
| Automated tests | Implemented | Backend/API/UI model tests, original hash verification |
| Real-browser cross-device signoff | Not verified here | Browser navigation blocked by administrator in authoring environment |
| Live collaborative classroom tools / accounts | Future | Not part of original scope |
| Advanced flowchart minimap, drag pan and exporting images | Future | Simple zoom and scroll available |
| Hardened production deployment | Future | Academic local deployment supported |

## Development ownership suggestions

- **Moksha:** Educational narration and problem demonstration; glossary and learning-map walkthrough.
- **Ricky:** Grammar engine and integration explanation; both parser modes; algorithm/test coverage.
- **Kashish:** Technology stack, responsive interface, demonstrations, testing and academic conclusion.

## Regression guard

Do not edit `protected/main.js` or `protected/parser_backend.js`. To compare copies against the supplied uploaded originals, run `npm test`: the first test checks exact SHA-256 hashes. Any legitimate future backend edit should be documented separately and would violate the current immutability requirement.
