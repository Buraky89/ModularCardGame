class Client {
    constructor(id, name) {
      this.id = id;
      this.name = name;
      this.isWaiting = true;
      this.deck = [];
    }
  
    acceptInput(cardIndex) {
      this.isWaiting = false;
      this.cardIndex = cardIndex;
    }
    
    updateDeck(deck) {
        this.deck = deck;
    }
    
    async waitForAnswer(deck, playedDeck) {
      this.deck = deck;
      console.log(`${this.name} is thinking...`);
      console.log(`${this.name}'s current deck:`, this.deck);
      while (this.isWaiting) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      this.isWaiting = true;
      return this.cardIndex;
    }
  
    getDeck() {
      return this.deck;
    }
  }
  
  module.exports = { Client };
  