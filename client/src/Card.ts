export class Card {
  score?: number;
  cardType?: CardType;
  hidden: boolean;

  constructor(score?: number, cardType?: CardType, hidden: boolean = false) {
    this.score = score;
    this.cardType = cardType;
    this.hidden = hidden;
  }

  play(): { score?: number; cardType?: CardType; hidden: boolean } {
    if (this.hidden) {
      return { hidden: true };
    }

    return { score: this.score, cardType: this.cardType, hidden: false };
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
