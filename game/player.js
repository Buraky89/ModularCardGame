const { Card, CardType } = require("./card");

class Player {
  constructor(name) {
    this.name = name;
    this.points = 0;
    this.deck = [];

    const cardTypes = Object.values(CardType);

    // Generate a random deck of cards for the player
    for (let i = 0; i < 5; i++) {
      const score = Math.floor(Math.random() * 10) + 1;
      const cardType = cardTypes[Math.floor(Math.random() * cardTypes.length)];
      this.deck.push(new Card(score, cardType));
    }
  }

  playTurn(turnNumber) {
    // Check if the player has a card in their deck
    if (this.deck.length === 0) {
      console.log(`${this.name} has no more cards in their deck.`);
      return null;
    }

    // Take the first card from the player's deck
    const card = this.deck.shift();
    const points = turnNumber * card.score;
    this.points += points;
    return { card: card.play(), points: points };
  }
}

exports.Player = Player;
