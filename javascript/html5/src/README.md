# Max Adder

[![Language: JavaScript](https://img.shields.io/badge/Language-JavaScript-F7DF1E?logo=javascript&logoColor=000)](https://developer.mozilla.org/docs/Web/JavaScript)
[![UI: HTML5](https://img.shields.io/badge/UI: HTML5-E34F26?logo=html5&logoColor=fff)](https://developer.mozilla.org/docs/Web/HTML)
[![AI: MCTS/UCT](https://img.shields.io/badge/AI: MCTS%2FUCT-5B4B8A)](../../../doc/engine_mcts_ucb.md)

Modern HTML5 implementation of Max Adder with an optional UCT/MCTS AI.
The project uses ES modules, a Web Worker, SVG rendering, and no runtime UI
framework.

## Features

- Play Max Adder on an 8 x 8 board with 64 number tiles.
- Use horizontal and vertical marker roles with Human or AI players.
- Complete the opening placement and score-allocation decision.
- Collect tile values and track both scores.
- Configure independent AI difficulty and device profiles.
- Navigate between the game, Rules, Options, and About views.
- Use the cached application as a Progressive Web App.

## Project Structure

```text
src/
├── index.html
├── README.md
├── package.json
├── vitest.config.js
├── playwright.config.js
├── css/index.css
├── js/
│   ├── common.js
│   ├── board.js
│   ├── store.js
│   ├── renderer.js
│   ├── hmi.js
│   ├── controller.js
│   └── uct/
│       ├── uct.js
│       └── uctnode.js
└── tests/
    ├── unit/
    └── e2e/
```

## Getting Started

Install dependencies with `npm install`. Because the application uses a module
Web Worker, serve it through HTTP rather than opening `index.html` directly:

```sh
node tests/server.js
```

Then open [http://localhost:4173](http://localhost:4173).

## Usage

1. Open the application.
2. Use the menu button to start a new game, open Rules, change Options, or
    view About.
3. During the opening phase, select any available tile for the marker.
4. Select which player's score receives the opening tile value.
5. On each regular turn, select an available tile in the active marker's row
    or column.
6. The tile value is added to the active player's score and the marker moves to
    that field.

Options provide Human or AI players, Easy/Medium/Hard difficulty for the
horizontal and vertical roles, and Auto/Desktop/Mobile AI device profiles.

## Rules Summary

- The board contains 64 randomly distributed values from -2 through +8.
- One player controls horizontal movement and the other controls vertical movement.
- The randomly selected starting player places the opening marker.
- The opponent decides which score receives the opening tile value.
- The player who did not receive that value makes the first regular move.
- A regular move collects an unvisited tile on the active marker's row or column.
- The highest accumulated score wins when all tiles are scored or no move remains.

The complete rules are in [../../../doc/rules.md](../../../doc/rules.md), with a
German translation in [../../../doc/regeln.md](../../../doc/regeln.md).

## Testing

```sh
npm test
npm run test:coverage
npm run test:e2e
npm run test:all
```

Unit tests cover tile setup, marker roles, opening allocation, legal movement,
scoring, terminal results, rendering, and UCT behavior. Playwright covers
identity, navigation, options, opening play, responsive layout, and
accessibility smoke checks.

## Documentation

- [Requirements](../../../doc/requirements.md)
- [Software architecture](../../../doc/software_architecture.md)
- [UCT/MCTS engine](../../../doc/engine_mcts_ucb.md)
- [English rules](../../../doc/rules.md)
- [German rules](../../../doc/regeln.md)

## License

See the repository [LICENSE](../../../LICENSE).
