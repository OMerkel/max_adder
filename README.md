# Max Adder

[![Language: JavaScript](https://img.shields.io/badge/Language-JavaScript-F7DF1E?logo=javascript&logoColor=000)](https://developer.mozilla.org/docs/Web/JavaScript)
[![UI: HTML5](https://img.shields.io/badge/UI-HTML5-E34F26?logo=html5&logoColor=fff)](https://developer.mozilla.org/docs/Web/HTML)
[![AI: MCTS/UCT](https://img.shields.io/badge/AI-MCTS%2FUCT-5B4B8A)](doc/engine_mcts_ucb.md)
[![Coverage: >96%](https://img.shields.io/badge/Coverage-%3E96%25-brightgreen)](javascript/html5/src/README.md#testing)

This repository contains a browser implementation of **Max Adder**, a
two-player strategy game played on an 8 x 8 board. Players collect numbered
tiles by moving markers horizontally or vertically, then compare their final
scores. The application includes optional MCTS/UCT computer AI opponents.

## Play the game

[Play online now.](https://omerkel.github.io/max_adder/javascript/html5/src/)

The application is a static HTML5/JavaScript app in
[javascript/html5/src](javascript/html5/src). Because it uses ES modules and a
Web Worker, serve the directory over HTTP rather than opening `index.html`
directly:

```sh
npm --prefix javascript/html5/src install
npm --prefix javascript/html5/src run dev
```

Then open [http://localhost:4173](http://localhost:4173). The app also supports
offline caching as a Progressive Web App.

## Rules

The complete rules are in [doc/rules.md](doc/rules.md). A German translation is
available in [doc/regeln.md](doc/regeln.md).

In brief:

- The board contains 64 randomly distributed tiles with values from -2 through
  +8. Each value is obtained by subtracting 4 from the result of rolling two
  six-sided dice.
- One player controls horizontal movement and the other controls vertical
  movement. The starting player is selected at random.
- The starting player places the opening marker on any tile and removes that
  tile. The opponent decides which score receives its value.
- The player who did not receive the opening value makes the first regular
  move. On each turn, a player moves their marker to an unvisited tile on its
  controlled row or column and adds the tile value to their score.
- The game ends when all tiles have been scored or the active marker has no
  remaining tile available on its controlled row or column. The highest score
  wins.

## Application features

The application uses ES modules, a Web Worker for game and AI control, and SVG
rendering. It supports:

- Human vs Human, Human vs AI, and AI vs AI games
- Independent horizontal and vertical player and AI difficulty settings
- Automatic, desktop, and mobile AI device profiles
- Responsive SVG board rendering with coordinate annotations
- Opening placement and score-allocation controls
- Move history, scores, legal-move highlights, and terminal results
- Rules, Options, About, and game views with sidebar navigation
- Offline caching as a Progressive Web App

The application architecture is documented in
[doc/software_architecture.md](doc/software_architecture.md).
The UCT/MCTS implementation and tuning details are documented in
[doc/engine_mcts_ucb.md](doc/engine_mcts_ucb.md). The browser project has its
own [README](javascript/html5/src/README.md) with implementation details.

## Testing

From the repository root:

```sh
npm --prefix javascript/html5/src test
npm --prefix javascript/html5/src run test:coverage
npm --prefix javascript/html5/src run test:e2e
npm --prefix javascript/html5/src run test:all
```

The test suite covers Max Adder tile setup, opening allocation, legal movement,
scoring, terminal results, rendering, UCT/MCTS behavior, application
navigation, options, board interaction, and browser behavior.
Coverage is generated locally in `javascript/html5/src/coverage/`.

## License

See [LICENSE](LICENSE) and [javascript/html5/src/LICENSE](javascript/html5/src/LICENSE).
