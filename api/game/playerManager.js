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
}

module.exports = { PlayerManager };
