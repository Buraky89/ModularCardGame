const { Card } = require("./card");
const prompt = require("prompt-sync")();

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

    console.log(`Which card would you like to play?`);
    this.deck.forEach((card, index) => {
      console.log(`${index}: ${card.cardType} ${card.score}`);
    });

    let selectedIndex = prompt("Enter the card index: ");
    selectedIndex = parseInt(selectedIndex);
    while (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= this.deck.length) {
      console.log(`Invalid index. Please enter a valid index.`);
      selectedIndex = prompt("Enter the card index: ");
      selectedIndex = parseInt(selectedIndex);
    }

    const card = this.deck[selectedIndex];
    this.deck.splice(selectedIndex, 1);
    this.points += turnNumber * card.score;
    playedDeck.addCard(card);

    return {
      card,
      points: turnNumber * card.score
    };
  }
}

module.exports = { Player };
