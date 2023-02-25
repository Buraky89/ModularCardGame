const { Player } = require("./player");

class PlayerManager {
  constructor() {
    this.players = [];
    this.clients = [];
  }

  createAllPlayers(clients) {
    this.clients = clients;
    this.players = clients.map((client, index) => {
      return new Player(`Player ${index + 1}`, client);
    });
    return this.players;
  }

  getClient(player) {
    return this.players.find(p => p.name === player.name).client;
  }

  giveTurn(player) {
    player.setIsTheirTurn(true);
    const playerInfo = [];
    for (const p of this.players) {
      if (p !== player) {
        p.setIsTheirTurn(false);
      }
      playerInfo.push({
        name: p.name,
        deckCount: p.deck.length,
        isTheirTurn: p.isTheirTurn
      });
    }
    for (const client of this.clients) {
      client.updatePlayerInfo(playerInfo);
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
