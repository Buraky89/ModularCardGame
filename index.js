const myModule = require("./module/module");

const { runGame } = require("./game/game");
const { Client } = require("./game/client");

const express = require("express");
const app = express();

const client1 = new Client(1, "Client 1");
const client2 = new Client(2, "Client 2");

app.use(express.json());

app.get("/", function(req, res) {
  //res.send(myModule.greet());
  runGame([client1, client2]);
  
  res.send("ok");
});

app.get("/client1", (req, res) => {
  const deck = client1.getDeck();
  let deckButtons = "";
  for (let i = 0; i < deck.length; i++) {
    deckButtons += `<button onclick="submitCard(${i})">${deck[i].cardType} ${deck[i].score}</button>`;
  }
  res.send(`
    <html>
      <body>
        <p>${client1.name}'s current deck:</p>
        ${deckButtons}
        <script>
          function submitCard(cardIndex) {
            fetch('/client1/submit', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ cardIndex })
            });
          }
        </script>
      </body>
    </html>
  `);
});

app.post("/client1/submit", (req, res) => {
  client1.acceptInput(req.body.cardIndex);
  
  res.sendStatus(200);
});

app.get("/client2", (req, res) => {
  const deck = client2.getDeck();
  let deckButtons = "";
  for (let i = 0; i < deck.length; i++) {
    deckButtons += `<button onclick="submitCard(${i})">${deck[i].cardType} ${deck[i].score}</button>`;
  }
  res.send(`
    <html>
      <body>
        <p>${client2.name}'s current deck:</p>
        ${deckButtons}
        <script>
          function submitCard(cardIndex) {
            fetch('/client2/submit', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ cardIndex })
            });
          }
        </script>
      </body>
    </html>
  `);
});

app.post("/client2/submit", (req, res) => {
  client2.acceptInput(req.body.cardIndex);
  res.sendStatus(200);
});

app.listen(3001, () => {
  console.log("Example app listening on port 3000!");
});
