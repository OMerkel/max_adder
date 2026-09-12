# Max Adder Requirements

## 1. Scope and decisions

This document defines the requirements for the Max Adder application from the
game rules, architecture and UCT documents, implementation, and automated tests.

The product is a browser-based implementation of Max Adder. It uses an 8 x 8
board, 64 randomly distributed number tiles, two independently controlled
markers, score tracking, a static HTML shell, sidebar navigation, an SVG
renderer, a Web Worker, and an MCTS/UCT computer opponent.

The following decisions define the implemented game:

* One player controls horizontal movement and the other controls vertical
  movement. The roles are assigned when a game starts.
* The 64 tiles represent the integers -2 through +8. Each tile value is based
  on the result of rolling two six-sided dice and subtracting 4.
* The starting player is selected randomly. That player places the first marker
  on any field and removes its tile. The opponent decides which score receives
  that first tile value.
* The player who did not receive the first score value makes the first regular
  move. Thereafter, players alternate turns.
* A regular move targets an unvisited field with a tile. The tile is removed and
  its value is added to the moving player's score.
* A horizontal player may move only along the row containing their marker. A
  vertical player may move only along the column containing their marker.
* The game ends when every tile has been scored or the active player has no
  remaining tile in the marker's current row or column. The highest score wins.

## 2. Functional requirements

### 2.1 Game rules

| ID | Requirement | Concern |
| --- | --- | --- |
| FR-GAME-001 | The game shall use an 8 x 8 board containing 64 number tiles. | Setup |
| FR-GAME-002 | Each tile shall represent an integer from -2 through +8, with values determined by two six-sided dice minus 4. | Setup |
| FR-GAME-003 | Tiles shall be distributed randomly across the board at the start of each game. | Setup |
| FR-GAME-004 | The game shall assign one player horizontal marker control and the other player vertical marker control. | Setup |
| FR-GAME-005 | The starting player shall be selected randomly. | Turn handling |
| FR-GAME-006 | The starting player shall place their marker on a chosen field and remove that field's tile. | Opening move |
| FR-GAME-007 | The opponent shall decide whether the opening tile value is added to their own score or the starting player's score. | Scoring |
| FR-GAME-008 | The player who did not receive the opening tile value shall make the first regular move. | Turn handling |
| FR-GAME-009 | Players shall alternate regular turns after the opening placement. | Turn handling |
| FR-GAME-010 | A regular move shall target an unvisited field containing a number tile. | Movement |
| FR-GAME-011 | A horizontal player shall move only within the row containing their marker. | Movement |
| FR-GAME-012 | A vertical player shall move only within the column containing their marker. | Movement |
| FR-GAME-013 | A regular move shall remove the target tile and add its value to the moving player's score. | Scoring |
| FR-GAME-014 | A tile shall not be scored more than once. | Scoring |
| FR-GAME-015 | The game shall end when all tiles have been scored or the active player has no remaining tile in the marker's current row or column. | End condition |
| FR-GAME-016 | The player with the highest accumulated score at game end shall win. | Result |

### 2.2 Human interaction and navigation

| ID | Requirement | Concern |
| --- | --- | --- |
| FR-UI-001 | The game board, Rules, Options, and About shall be separate views. | Navigation |
| FR-UI-002 | At most one application view shall be visible at any time. | Navigation |
| FR-UI-003 | The hamburger menu shall navigate to New Game, Rules, Options, and About. | Navigation |
| FR-UI-004 | Rules Back, About Back, Options OK, Options Cancel, menu close, and overlay close shall return to the game view. | Navigation |
| FR-UI-005 | Options OK shall apply selected settings before returning to the game. Options Cancel and Back shall return without applying a new selection. | Navigation |
| FR-UI-006 | A human shall select a legal highlighted destination for the active marker. | Board interaction |
| FR-UI-007 | The UI shall show the active player, marker roles, available destinations, last move, scores, remaining tiles, and terminal result. | Feedback |
| FR-UI-008 | The UI shall use horizontal and vertical player terminology and identify the application as Max Adder. | Presentation |
| FR-UI-009 | The UI shall support Human vs Human, Human vs AI, and AI vs AI play. | Player modes |
| FR-UI-010 | Options shall provide independent player type, AI difficulty, and device-profile settings for both players. | Configuration |
| FR-UI-011 | The game view shall display both accumulated scores and the score awarded for the latest collected tile. | Game feedback |
| FR-UI-012 | The UI shall clearly distinguish the opening placement, regular moves, and the player's decision about the opening score. | Game feedback |
| FR-UI-013 | The application title bar shall display a hamburger icon that opens the sidebar navigation. | Navigation |
| FR-UI-014 | The sidebar shall provide New Game, Rules, Options, and About entries, plus a control to close the sidebar. | Navigation |
| FR-UI-015 | Selecting Rules, Options, or About in the sidebar shall hide the game view and show exactly the selected subpage. | Navigation |
| FR-UI-016 | The overlay and sidebar close controls shall close the sidebar and return interaction to the current view. | Navigation |
| FR-UI-017 | Each subpage shall provide a Back control that switches to the game view. | Navigation |
| FR-UI-018 | The title bar shall show the current application or subpage title and an application badge. | Presentation |
| FR-UI-019 | The application badge shall show the two player settings and the resolved AI device profile, and shall update when settings change. | Presentation |
| FR-UI-020 | The Rules subpage shall present the Max Adder rules; the Options subpage shall expose player and AI settings; and the About subpage shall present application and licensing information. | Content |

### 2.3 AI and worker interaction

| ID | Requirement | Concern |
| --- | --- | --- |
| FR-AI-001 | The AI shall consume the same legal-action and result interfaces as a human player. | Integration |
| FR-AI-002 | The AI shall use the existing UCT/MCTS search with configurable iteration, time, simulation-depth, and look-ahead budgets. | Search |
| FR-AI-003 | Difficulty and device profile shall select the active player's search budget. | Configuration |
| FR-AI-004 | The Web Worker shall own authoritative board state and apply validated human and AI actions. | Concurrency |
| FR-AI-005 | The worker shall support `start`, `restart`, `move`, `action_by_ai`, and `sync` requests. | Protocol |
| FR-AI-006 | The worker shall publish `redraw`, `human_to_move`, and `ai_to_move` states. A settings sync shall restore the correct turn state. | Protocol |

### 2.4 Packaging and content

| ID | Requirement | Concern |
| --- | --- | --- |
| FR-PACK-001 | The application shall load as a static HTML5 application through HTTP. | Deployment |
| FR-PACK-002 | The PWA service worker shall cache the current Max Adder application assets and remove obsolete caches. | Offline use |
| FR-PACK-003 | In-app Rules and About content shall describe Max Adder and its number-tile scoring rules. | Content |
| FR-PACK-004 | Repository documentation shall include English and German rules, architecture, and UCT/MCTS documentation. | Documentation |

## 3. Non-functional requirements

### 3.1 Correctness and integrity

| ID | Requirement | Concern |
| --- | --- | --- |
| NFR-COR-001 | Board transitions shall be deterministic for a given state, random seed, and action. | Domain integrity |
| NFR-COR-002 | Illegal actions shall leave the state unchanged. | Domain integrity |
| NFR-COR-003 | Board copies used by search shall not share mutable tile, marker, score, or history state with the source. | Simulation integrity |
| NFR-COR-004 | The state model shall represent empty tiles, remaining number values, both marker positions, both player roles, scores, and the active player explicitly. | Model integrity |
| NFR-COR-005 | Human and AI moves shall use the same legality, scoring, and terminal-result implementation. | Consistency |

### 3.2 Usability and accessibility

| ID | Requirement | Concern |
| --- | --- | --- |
| NFR-USE-001 | The board and every subpage shall remain usable after navigation, settings sync, New Game, Cancel, and Back. | Responsiveness |
| NFR-USE-002 | The layout shall work on desktop and mobile viewports. | Responsive UI |
| NFR-USE-003 | Board controls shall expose meaningful labels, visible state, and keyboard/browsing semantics where supported by the HTML controls. | Accessibility |
| NFR-USE-004 | The SVG board shall have an accessible Max Adder label; decorative SVG content shall not be exposed as redundant content. | Accessibility |
| NFR-USE-005 | The application shall avoid UI locks, stale overlays, and hidden views intercepting input. | Interaction integrity |
| NFR-USE-006 | The score display shall remain visible without overlapping the board in landscape and portrait orientations. | Responsive layout |
| NFR-USE-007 | Scores, tile values, and history text shall wrap within their panels without overflowing the viewport. | Responsive layout |

### 3.3 Performance and availability

| ID | Requirement | Concern |
| --- | --- | --- |
| NFR-PERF-001 | AI computation shall run in a Web Worker so rendering and navigation remain responsive. | Responsiveness |
| NFR-PERF-002 | AI budgets shall provide Easy, Medium, and Hard profiles for Desktop and Mobile devices. | Performance tuning |
| NFR-PERF-003 | The UI shall render board updates without reloading the page. | Runtime efficiency |
| NFR-AVAIL-001 | After the first successful load, the PWA shall serve cached application assets while offline. | Availability |

### 3.4 Maintainability and quality

| ID | Requirement | Concern |
| --- | --- | --- |
| NFR-MAINT-001 | Domain logic shall remain pure and independently testable apart from the mutable UCT adapter. | Architecture |
| NFR-MAINT-002 | UI state transitions shall remain explicit through the store reducer and action types. | Architecture |
| NFR-MAINT-003 | The worker protocol and board state contract shall be documented and kept synchronized with implementation. | Documentation |
| NFR-QUAL-001 | Unit tests shall cover tile setup, marker roles, legal horizontal and vertical movement, scoring, opening allocation, end conditions, copying, renderer data, and UCT behavior. | Verification |
| NFR-QUAL-002 | E2E tests shall cover identity, navigation, one-visible-view behavior, options, unchanged Options OK, New Game, human movement, scoring, and browser compatibility. | Verification |
| NFR-QUAL-003 | Aggregate unit-test coverage shall remain above 96 percent for statements, branches, and functions. | Verification |
| NFR-QUAL-004 | Biome and Markdownlint shall report no diagnostics for configured source documentation. | Tooling |

## 4. Architecture blocks and responsibilities

### A. Domain model and rules engine

**Modules:** `js/common.js`, `js/board.js`

The rules engine owns the 8 x 8 tile grid, marker positions, horizontal and
vertical player roles, active player, scores, remaining tiles, legal action
generation, opening allocation, terminal result, and immutable state
transitions. It exposes `createBoard`, `getActions`, `doAction`, `getResult`,
and the mutable `Board` adapter required by UCT.

### B. AI search and worker orchestration

**Modules:** `js/uct/uct.js`, `js/uct/uctnode.js`, `js/controller.js`

UCT/MCTS searches copies of the Max Adder board. The worker is the sole
authority that mutates the live game, chooses budgets, validates actions,
handles opening and regular turns, evaluates score outcomes, and communicates
through the defined request and status messages.

### C. Application state and UI composition

**Modules:** `js/store.js`, `js/hmi.js`

The reducer stores the current view, board snapshot, selectable actions, phase,
scores, and player/AI settings. HMI connects DOM navigation, options, worker
messages, and renderer updates. View navigation must set exactly one view as
visible.

### D. Board presentation

**Module:** `js/renderer.js`

The renderer owns SVG cells, number tiles, marker indicators, highlights,
score and status text, click overlays, and accessibility metadata. It consumes
board snapshots and selectable actions without implementing game rules.

### E. Static shell, content, and PWA

**Files:** `index.html`, `css/index.css`, `sw.js`, manifests, image assets

The shell provides the game board container, Rules, Options, About, sidebar,
and title bar. CSS must preserve the hidden-view invariant. The service worker,
manifests, and assets must use the Max Adder identity and current paths.

### F. Verification and quality gates

**Files:** `tests/unit`, `tests/e2e`, `vitest.config.js`, `playwright.config.js`,
`biome.json`, `.markdownlint.json`

Unit tests verify domain and AI behavior. Playwright verifies user-visible
flows in supported browsers. Biome and Markdownlint are required quality gates.

## 5. Traceability and contradiction resolution

| Source or observation | Resolution |
| --- | --- |
| The rules define one horizontal marker and one vertical marker rather than two opposing armies. | The board state and UI model marker positions and player roles explicitly. |
| The opening placement is scored by the opponent's allocation decision. | Opening placement and score allocation are separate actions before regular alternating turns begin. |
| Number values range from -2 through +8 and are derived from two dice minus 4. | Tile generation and setup requirements use these exact values and distribution. |
| A move may be unavailable when the current row or column has no remaining tile. | Legal-action generation and terminal-result evaluation use remaining tiles in the active marker's controlled axis. |
| The game ends when all tiles are scored or a player has no available move. | The result model records the terminal condition and compares accumulated scores. |
| UCT requires mutable search state while the application needs deterministic transitions. | The adapter is retained for search, while authoritative live transitions remain in pure board functions and the worker. |
| Settings sync must restore the current interaction state. | The worker must return the current board and turn state after synchronization. |
