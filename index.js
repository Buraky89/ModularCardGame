const myModule = require("./module/module");

const { runGame } = require("./game/game");
const { Client } = require("./game/client");

const express = require("express");
const app = express();

const client1 = new Client(1, "Client 1");
const client2 = new Client(2, "Client 2");

app.get("/", function(req, res) {
  //res.send(myModule.greet());

  

  runGame([client1, client2]);

  res.send("ok");

});

app.listen(3001, function() {
  console.log("Example app listening on port 3000!");
});
