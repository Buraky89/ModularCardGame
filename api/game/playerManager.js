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

  getPlayerInfo() {
    return this.players.map(player => ({
      name: player.name,
      deckCount: player.deck.length,
      isTheirTurn: player.isTheirTurn
    }));
  }
}

module.exports = { PlayerManager };
