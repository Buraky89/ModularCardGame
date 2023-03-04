export class Card {
  score: number;
  cardType: CardType;

  constructor(score: number, cardType: CardType) {
    this.score = score;
    this.cardType = cardType;
  }

  play() {
    return { score: this.score, cardType: this.cardType };
  }
}

export enum CardType {
  SPADES = "Spades",
  HEARTS = "Hearts",
  DIAMONDS = "Diamonds",
  CLUBS = "Clubs",
}

export interface ApiResponse {
  deck: Card[];
  playedDeck: {
    deck: Card[];
  };
  players: Player[];
}

export interface Player {
  name: string;
  uuid: string;
  deck: Card[];
  points: number;
  isTheirTurn: boolean;
}
