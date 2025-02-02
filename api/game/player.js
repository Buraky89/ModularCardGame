class Player {
  constructor(name, client) {
    this.name = name;
    this.deck = [];
    this.points = 0;
    this.client = client;
    this.isTheirTurn = false;
  }

  setCards(cards) {
    this.deck = cards;
    this.client.updateDeck(this.deck);
  }

  setIsTheirTurn(isTheirTurn) {
    this.isTheirTurn = isTheirTurn;
  }

  async playTurn(turnNumber, playedDeck) {
    // Check if the player has a card in their deck
    if (this.deck.length === 0) {
      console.log(`${this.name} has no more cards in their deck.`);
      return null;
    }

    console.log(`Which card would you like to play?`);
    const selectedIndex = await this.client.waitForAnswer(this.deck, playedDeck);
    const card = this.deck[selectedIndex];
    this.deck.splice(selectedIndex, 1);
    this.points += turnNumber * card.score;
    playedDeck.addCard(card);
    this.client.updateDeck(this.deck);
    return {
      card,
      points: turnNumber * card.score
    };
  }
}

module.exports = { Player };
