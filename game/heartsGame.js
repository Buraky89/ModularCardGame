const { Player } = require("./player");
const { CardEngine } = require("./cardEngine");
const { PlayedDeck } = require("./playedDeck");

function playGame() {
  const cardEngine = new CardEngine();
  const player1 = new Player("Player 1");
  const player2 = new Player("Player 2");
  const playedDeck = new PlayedDeck();

  player1.setCards(cardEngine.getNextCards());
  player2.setCards(cardEngine.getNextCards());

  let turnNumber = 1;
  while (player1.deck.length > 0 || player2.deck.length > 0) {
    console.log(`Turn ${turnNumber}:`);
    const result1 = player1.playTurn(turnNumber, playedDeck);
    const result2 = player2.playTurn(turnNumber, playedDeck);
    if (result1) {
      console.log(`${player1.name} played ${result1.card.cardType} and earned ${result1.points} points`);
    } else {
      console.log(`${player1.name} has no more cards in their deck.`);
    }
    if (result2) {
      console.log(`${player2.name} played ${result2.card.cardType} and earned ${result2.points} points`);
    } else {
      console.log(`${player2.name} has no more cards in their deck.`);
    }
    console.log("Last two cards played:", playedDeck.showLastCards());
    turnNumber++;
  }

  console.log(`${player1.name}: ${player1.points} points`);
  console.log(`${player2.name}: ${player2.points} points`);
}

module.exports = { playGame };
