class Client {
    async waitForAnswer(deck, playedDeck) {
      console.log("hmm I have these deck: ");
      console.log(deck);
      console.log("hmm I have to play " + deck[0].cardType + " " + deck[0].score);
      return 0;
    }
  }
  
  module.exports = { Client };
  