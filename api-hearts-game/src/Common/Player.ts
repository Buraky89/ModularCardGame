import { Card } from "./Card";

class Player {
  name: string;
  deck: Card[];
  points: number;
  isTheirTurn: boolean;

  constructor(name: string) {
    this.name = name;
    this.deck = [];
    this.points = 0;
    this.isTheirTurn = false;
  }

  setCards(cards: Card[]) {
    this.deck = cards;
  }

  setIsTheirTurn(isTheirTurn: boolean) {
    this.isTheirTurn = isTheirTurn;
  }

  async playTurn(turnNumber: number, playedDeck: any, selectedIndex: number) {
    // Check if the player has a card in their deck
    if (this.deck.length === 0) {
      console.log(`${this.name} has no more cards in their deck.`);
      return null;
    }

    console.log(`Which card would you like to play?`);
    const card = this.deck[selectedIndex];
    this.deck.splice(selectedIndex, 1);
    this.points += turnNumber * card.score;
    playedDeck.addCard(card);
    return {
      card,
      points: turnNumber * card.score,
    };
  }
}

export { Player };
