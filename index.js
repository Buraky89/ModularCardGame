const myModule = require("./module/module");

const game = require("./game/game");

const express = require("express");
const app = express();

app.get("/", function(req, res) {
  //res.send(myModule.greet());

  game.run();

  res.send("ok");

});

app.listen(3001, function() {
  console.log("Example app listening on port 3000!");
});
