class Player {
constructor(name) {
    this.name = name;
    this.points = 0;
    this.deck = [];
}

setCards(cards) {
    this.deck = cards;
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
  