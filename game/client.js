class Client {
    constructor(id, name) {
      this.id = id;
      this.name = name;
    }
  
    async waitForAnswer(deck, playedDeck) {
      console.log(`Client ${this.id} (${this.name}) is thinking...`);
      console.log(`Available deck: ${JSON.stringify(deck)}`);
      console.log(`Client ${this.id} (${this.name}) is going to play ${deck[0].cardType} ${deck[0].score}`);
      return 0;
    }
  }
  
  module.exports = { Client };
  