const { playGame } = require("./heartsGame");

function runGame(clients) {
  playGame(clients);
}

module.exports = { runGame };
