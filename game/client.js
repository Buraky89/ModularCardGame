class Client {
    constructor(id, name) {
      this.id = id;
      this.name = name;
      this.isWaiting = true;
      this.deck = [];
    }
  
    async acceptInput(cardIndex) {
      let currentDeckLength = this.getDeck().length;
      this.isWaiting = false;
      this.cardIndex = cardIndex;
      
      // TODO: fix this later. make this optional, so that we can decide whether the client should wait for the deck immediately or not.
      while (currentDeckLength === this.getDeck().length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return this.getDeck();
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
  