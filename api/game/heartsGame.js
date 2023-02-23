const { CardEngine } = require("./cardEngine");
const { PlayedDeck } = require("./playedDeck");
const { PlayerManager } = require("./playerManager");

async function playGame(clients) {
  const cardEngine = new CardEngine();

  const playerManager = new PlayerManager();
  const players = playerManager.createAllPlayers(clients);
  
  const playedDeck = new PlayedDeck();

  players.forEach(player => {
    player.setCards(cardEngine.getNextCards());
  });

  let turnNumber = 1;
  while (players.some(player => player.deck.length > 0)) {
    console.log(`Turn ${turnNumber}:`);
    for (const player of players) {
      if (player.deck.length === 0) {
        continue;
      }
      const result = await player.playTurn(turnNumber, playedDeck);
      if (result) {
        console.log(`${player.name} played ${result.card.cardType} and earned ${result.points} points`);
      } else {
        console.log(`${player.name} has no more cards in their deck.`);
      }

      // TODO: make this better by event distribution.
      clients[0].updatePlayedDeck(playedDeck);
      clients[1].updatePlayedDeck(playedDeck);
    }
    console.log("Last two cards played:", playedDeck.showLastCards());
    turnNumber++;
  }

  console.log(`${player1.name}: ${player1.points} points`);
  console.log(`${player2.name}: ${player2.points} points`);
}

module.exports = { playGame };

