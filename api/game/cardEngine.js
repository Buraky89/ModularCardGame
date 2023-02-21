const { Card, CardType } = require("./card");

class CardEngine {
  constructor() {
    this.deck = [];

    // Create a deck of 52 cards
    const cardTypes = Object.values(CardType);
    for (const cardType of cardTypes) {
      for (let i = 1; i <= 13; i++) {
        this.deck.push(new Card(i, cardType));
      }
    }
  }

  getNextCards() {
    const cards = [];
    for (let i = 0; i < 13; i++) {
      // Get a random card from the deck
      const randomIndex = Math.floor(Math.random() * this.deck.length);
      const card = this.deck[randomIndex];
      cards.push(card);

      // Remove the card from the deck
      this.deck.splice(randomIndex, 1);
    }
    return cards;
  }
}

exports.CardEngine = CardEngine;
