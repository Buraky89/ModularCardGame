enum CardType {
  SPADES = "Spades",
  HEARTS = "Hearts",
  DIAMONDS = "Diamonds",
  CLUBS = "Clubs",
}

class Card {
  public score: number;
  public cardType: CardType;

  constructor(score: number, cardType: CardType) {
    this.score = score;
    this.cardType = cardType;
  }
}

export { Card, CardType };
