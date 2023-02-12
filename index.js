const myModule = require("./module/module");



const express = require("express");
const app = express();

app.get("/", function(req, res) {
  res.send(myModule.greet());
});

app.listen(3001, function() {
  console.log("Example app listening on port 3000!");
});
