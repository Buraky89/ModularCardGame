import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { GameService } from "./Services/Gameservice";
import { EventManager } from "./Services/EventManager";
import { connect, Channel } from "amqplib";
import Events from "./Common/Events";
import cors from "cors";
import { getNameOfJSDocTypedef } from "typescript";

enum GameState {
  NOT_STARTED,
  STARTED,
  ENDED,
}

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, world!");
});

let channel: Channel;

app.get("/players/:uuid", async (req: Request, res: Response) => {
  const { uuid } = req.params;
  try {
    const data = await eventManager.gameService.getGameData(uuid);
    res.json(data);
  } catch (error) {
    res.status(404).send(error);
  }
});

async function sendNewPlayerWantsToJoin() {
  const players = [
    {
      date: "2023-02-28T12:00:00Z",
      ip: "192.168.0.1",
      uuid: "123e4567-e89b-12d3-a456-426655440000",
      playerName: "Player 1",
    },
    {
      date: "2023-02-28T12:05:00Z",
      ip: "192.168.0.2",
      uuid: "223e4567-e89b-12d3-a456-426655440000",
      playerName: "Player 2",
    },
    {
      date: "2023-02-28T12:10:00Z",
      ip: "192.168.0.3",
      uuid: "323e4567-e89b-12d3-a456-426655440000",
      playerName: "Player 3",
    },
    {
      date: "2023-02-28T12:15:00Z",
      ip: "192.168.0.4",
      uuid: "423e4567-e89b-12d3-a456-426655440000",
      playerName: "Player 4",
    },
  ];

  for (const player of players) {
    const message = {
      event: Events.NewPlayerWantsToJoin,
      payload: player,
    };
    const buffer = Buffer.from(JSON.stringify(message));
    await channel.publish("", "game-events", buffer);
  }

  var message = {
    event: Events.PlayerAttemptsToPlay,
    payload: {
      uuid: players[0].uuid,
      selectedIndex: 0,
    },
  };
  var buffer = Buffer.from(JSON.stringify(message));
  await channel.publish("", "game-events", buffer);

  message = {
    event: Events.PlayerAttemptsToPlay,
    payload: {
      uuid: players[1].uuid,
      selectedIndex: 0,
    },
  };
  buffer = Buffer.from(JSON.stringify(message));
  await channel.publish("", "game-events", buffer);
}

async function main() {
  const connection = await connect("amqp://localhost");
  channel = await connection.createChannel();
  await channel.assertQueue("game-events");
  //await sendNewPlayerWantsToJoin();
  //await channel.close(); // TODO: do it when service ends
  //await connection.close();
}

const port = 3001;

var eventManager = new EventManager();
eventManager
  .start()
  .then(() => {
    console.log("EventManager started");
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}.`);

      main().catch((err) => console.error(err));
    });
  })
  .catch((error) => {
    console.error("Error starting EventManager", error);
  });

app.post("/players/:uuid/play", async (req: Request, res: Response) => {
  const { uuid } = req.params;
  const { cardIndex } = req.body;

  const message = {
    event: Events.PlayerAttemptsToPlay,
    payload: {
      uuid,
      selectedIndex: cardIndex,
    },
  };
  console.log("msggg", message);
  const buffer = Buffer.from(JSON.stringify(message));
  await channel.publish("", "game-events", buffer);

  res.send("OK");
});

app.post("/join", async (req, res) => {
  const { playerName, uuid } = req.body;
  const date = new Date();
  const ip = req.ip;

  const message = {
    event: Events.NewPlayerWantsToJoin,
    payload: {
      date,
      ip,
      uuid,
      playerName,
    },
  };
  const buffer = Buffer.from(JSON.stringify(message));

  try {
    await channel.publish("", "game-events", buffer);
    res.status(200).json({ message: "Player joined the game" });
  } catch (err) {
    console.error("Error publishing message", err);
    res.status(500).json({ message: "Error joining the game" });
  }
});

app.post("/players/:uuid/start", async (req: Request, res: Response) => {
  const { uuid } = req.params;

  if (eventManager.gameService.gameState == GameState.ENDED) {
    eventManager.stop();
    eventManager.gameService = new GameService();
    eventManager
      .start()
      .then(() => {
        console.log("GameService started");
      })
      .catch((error) => {
        console.error("Error starting GameService", error);
      });
    res.send("OK");
  } else {
    const message = {
      event: Events.GameStartRequested,
      payload: {
        uuid,
      },
    };
    const buffer = Buffer.from(JSON.stringify(message));
    await channel.publish("", "game-events", buffer);
    res.send("OK");
  }
});
