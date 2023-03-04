enum CardType {
  SPADES = "Spades",
  HEARTS = "Hearts",
  DIAMONDS = "Diamonds",
  CLUBS = "Clubs",
}

export class RepresentedCard {
  score?: number;
  cardType?: CardType;
  hidden: boolean;

  constructor(score?: number, cardType?: CardType, hidden: boolean = false) {
    this.score = score;
    this.cardType = cardType;
    this.hidden = hidden;
  }
}

class Card {
  public score: number;
  public cardType: CardType;

  constructor(score: number, cardType: CardType) {
    this.score = score;
    this.cardType = cardType;
  }

  toRepresentedCard(isHidden: boolean): RepresentedCard {
    const representedCard: RepresentedCard = {
      score: isHidden ? undefined : this.score,
      cardType: isHidden ? undefined : this.cardType,
      hidden: isHidden,
    };
    return representedCard;
  }
}

export { Card, CardType };
