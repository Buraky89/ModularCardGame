import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { GameService } from "./Services/Gameservice";
import { connect, Channel } from "amqplib";

const app = express();

app.use(bodyParser.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, world!");
});

async function sendNewPlayerWantsToJoin(channel: Channel) {
  const players = [
    {
      date: "2023-02-28T12:00:00Z",
      ip: "192.168.0.1",
      uuid: "123e4567-e89b-12d3-a456-426655440000",
    },
    {
      date: "2023-02-28T12:05:00Z",
      ip: "192.168.0.2",
      uuid: "223e4567-e89b-12d3-a456-426655440000",
    },
    {
      date: "2023-02-28T12:10:00Z",
      ip: "192.168.0.3",
      uuid: "323e4567-e89b-12d3-a456-426655440000",
    },
    {
      date: "2023-02-28T12:15:00Z",
      ip: "192.168.0.4",
      uuid: "423e4567-e89b-12d3-a456-426655440000",
    },
  ];

  for (const player of players) {
    const message = {
      event: "NewPlayerWantsToJoin",
      payload: player,
    };
    const buffer = Buffer.from(JSON.stringify(message));
    await channel.publish("", "game-events", buffer);
  }
}

async function main() {
  const connection = await connect("amqp://localhost");
  const channel = await connection.createChannel();
  await channel.assertQueue("game-events");
  await sendNewPlayerWantsToJoin(channel);
  await channel.close();
  await connection.close();
}

const port = 3001;

const gameService = new GameService();
gameService
  .start()
  .then(() => {
    console.log("GameService started");
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}.`);

      main().catch((err) => console.error(err));
    });
  })
  .catch((error) => {
    console.error("Error starting GameService", error);
  });
