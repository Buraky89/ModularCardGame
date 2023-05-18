import { response } from "express";
import { Card, CardType, RepresentedCard } from "./Card";

class Player {
  name: string;
  uuid: string;
  private _deck: Card[];
  points: number;
  isTheirTurn: boolean;
  deck: RepresentedCard[];
  isFirstPlayer: boolean;

  constructor(name: string, uuid: string) {
    this.name = name;
    this.uuid = uuid;
    this._deck = [];
    this.points = 0;
    this.isTheirTurn = false;
    this.deck = [];
    this.isFirstPlayer = false;
  }

  restartAsClean() {
    this._deck = [];
    this.points = 0;
    this.isTheirTurn = false;
    this.deck = [];
    this.isFirstPlayer = false;
  }

  setCards(cards: Card[]) {
    this._deck = cards;
  }

  hasCard(c: Card): boolean {
    return this._deck.includes(c);
  }

  hasOnlyHearts(): boolean {
    for (const card of this._deck) {
      if (card.cardType !== CardType.HEARTS) {
        return false;
      }
    }
    return true;
  }
  hasCardOfSuit(cardType: CardType): boolean {
    for (const card of this._deck) {
      if (card.cardType === cardType) {
        return true;
      }
    }
    return false;
  }

  getDeck(): Card[] {
    return this._deck;
  }

  setIsTheirTurn(isTheirTurn: boolean) {
    this.isTheirTurn = isTheirTurn;
  }

  updateDeck() {
    console.log("update deck working");
    const representedDeck: RepresentedCard[] = [];
    for (const card of this._deck) {
      const representedCard = card.toRepresentedCard(true);
      representedDeck.push(representedCard);
    }
    console.log("deck", representedDeck);
    this.deck = representedDeck;
  }

  async playTurn(turnNumber: number, playedDeck: any, selectedIndex: number) {
    // Check if the player has a card in their deck
    if (this._deck.length === 0) {
      console.log(`${this.name} has no more cards in their deck.`);
      return null;
    }

    console.log(`Which card would you like to play?`, selectedIndex);
    const card = this._deck[selectedIndex];
    this._deck.splice(selectedIndex, 1);
    this.updateDeck();
    this.points += turnNumber * card.score;
    playedDeck.push(card);
    return {
      card,
      points: turnNumber * card.score,
    };
  }

  setFirstPlayer(): void {
    this.isFirstPlayer = true;
    this.isTheirTurn = true;
  }
}

export { Player };
