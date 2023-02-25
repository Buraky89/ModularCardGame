const { Player } = require("./player");

class PlayerManager {
  constructor() {
    this.players = [];
  }

  createAllPlayers(clients) {
    this.players = clients.map((client, index) => {
      return new Player(`Player ${index + 1}`, client);
    });
    return this.players;
  }

  getClient(player) {
    return this.players.find(p => p.name === player.name).client;
  }

  giveTurn(player) {
    for (const currentPlayer of this.players) {
      if (currentPlayer === player) {
        currentPlayer.setIsTheirTurn(true);
      } else {
        currentPlayer.setIsTheirTurn(false);
      }
    }
  }
}

module.exports = { PlayerManager };
