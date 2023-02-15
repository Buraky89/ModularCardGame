class PlayedDeck {
    constructor() {
        this.deck = [];
    }

    addCard(card) {
        this.deck.push(card);
    }

    showLastCards() {
        return this.deck.slice(-2);
    }
}

module.exports = { PlayedDeck };
  