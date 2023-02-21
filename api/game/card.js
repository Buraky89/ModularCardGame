class Card {
    constructor(score, cardType) {
      this.score = score;
      this.cardType = cardType;
    }
  
    play() {
      return { score: this.score, cardType: this.cardType };
    }
  }
  
  exports.Card = Card;
  exports.CardType = {
    SPADES: "Spades",
    HEARTS: "Hearts",
    DIAMONDS: "Diamonds",
    CLUBS: "Clubs"
  };
  