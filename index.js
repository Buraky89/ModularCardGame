const myModule = require("./module/module");

const { Card, CardType } = require("./game/card");
const { Player } = require("./game/player");


const express = require("express");
const app = express();

app.get("/", function(req, res) {
  //res.send(myModule.greet());



  const player1 = new Player("Player 1");
  const player2 = new Player("Player 2");
  
  let turnNumber = 1;
  
  while (player1.deck.length > 0 || player2.deck.length > 0) {
    console.log(`Turn ${turnNumber}:`);
    const result1 = player1.playTurn(turnNumber);
    const result2 = player2.playTurn(turnNumber);
    if (result1) {
      console.log(`${player1.name} played ${result1.card.cardType} and earned ${result1.points} points`);
    } else {
      console.log(`${player1.name} has no more cards in their deck.`);
    }
    if (result2) {
      console.log(`${player2.name} played ${result2.card.cardType} and earned ${result2.points} points`);
    } else {
      console.log(`${player2.name} has no more cards in their deck.`);
    }
    turnNumber++;
  }
  
  console.log(`${player1.name}: ${player1.points} points`);
  console.log(`${player2.name}: ${player2.points} points`);

  

  res.send("ok");

});

app.listen(3001, function() {
  console.log("Example app listening on port 3000!");
});
