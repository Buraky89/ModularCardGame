const { Card } = require("./card");

class Player {
  constructor(name) {
    this.name = name;
    this.deck = [];
    this.points = 0;
  }

  setCards(cards) {
    this.deck = cards;
  }

  playTurn(turnNumber, playedDeck) {
    // Check if the player has a card in their deck
    if (this.deck.length === 0) {
    console.log(`${this.name} has no more cards in their deck.`);
    return null;
    }

    // Take the first card from the player's deck
    const card = this.deck.pop();
    this.points += turnNumber * card.score;
    playedDeck.addCard(card);

    return {
      card: card,
      points: turnNumber * card.score
    };
  }
}

module.exports = { Player };
