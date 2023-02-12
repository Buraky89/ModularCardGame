class Card {
    constructor(score, cardType) {
      this.score = score;
      this.cardType = cardType;
    }
  }
  
  exports.Card = Card;
  exports.CardType = {
    SPADES: "Spades",
    HEARTS: "Hearts",
    DIAMONDS: "Diamonds",
    CLUBS: "Clubs"
  };
  