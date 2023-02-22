const myModule = require("./module/module");

const { runGame } = require("./game/game");
const { Client } = require("./game/client");

const express = require("express");
const app = express();

const cors = require('cors');

// Enable CORS for all routes
app.use(cors());

const client1 = new Client(1, "Client 1");
const client2 = new Client(2, "Client 2");

app.use(express.json());

app.get("/", (req, res) => {
  runGame([client1, client2]);
  res.send(`
    <html>
    <head>
        <title>Card Game</title>
    </head>
    <body>
        <h1>Card Game</h1>
        <iframe src="http://localhost:3001/client1" width="320" height="240" frameborder="0" scrolling="no"></iframe>
        <iframe src="http://localhost:3001/client2" width="320" height="240" frameborder="0" scrolling="no"></iframe>
    </body>
    </html>
  `);
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
            })
            .then(() => {
                setTimeout(() => { window.location.reload(); }, 200);
            });
          }
        </script>
      </body>
    </html>
  `);
});

app.post("/client1/submit", async (req, res) => {
    const deck = await client1.acceptInput(req.body.cardIndex);
    res.json({ deck });
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
            })
            .then(() => {
                setTimeout(() => { window.location.reload(); }, 200);
            });
          }
        </script>
      </body>
    </html>
  `);
});

app.post("/client2/submit", async (req, res) => {
    const deck = await client2.acceptInput(req.body.cardIndex);
    res.json({ deck });
});

app.get("/client1/deck", (req, res) => {
  const deck = client1.getDeck();
  res.json({ deck });
});

app.get("/client2/deck", (req, res) => {
  const deck = client2.getDeck();
  res.json({ deck });
});

app.listen(3001, () => {
  console.log("Example app listening on port 3000!");
});
