import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import { RealmService } from "./Services/RealmService";
import { connect, Channel } from "amqplib";
import Events from "./Common/Events";
import cors from "cors";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { Server } from "socket.io";
import { createServer } from "http";
import path from "path";
import { GeneralEventManager } from "./Services/GeneralEventManager";

interface AuthenticatedRequest extends Request {
  user?: {
    uuid: string;
    username: string;
    avatar: string;
  };
}

enum GameState {
  NOT_STARTED,
  STARTED,
  ENDED,
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // adjust this to your specific origin
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  // TODO: add authentication
  // socket.use(async (packet, next) => {
  //   // const token = packet[1]?.token;
  //   // if (!token) {
  //   //   return next(new Error("Authentication error"));
  //   // }
  //   // ... (rest of the existing authenticateToken function)
  //   // jwt.verify(token, publicKey, { algorithms: ["RS256"] }, (err, decoded) => {
  //   //   if (err) {
  //   //     return next(new Error("Authentication error"));
  //   //   }
  //   //   const { sid, preferred_username } = decoded as TokenPayload;
  //   //   socket.user = { uuid: sid, username: preferred_username, avatar: "" };
  //   //   next();
  //   // });
  // });

  socket.on("joinGameEventQueue", async ({ jwtToken, gameUuid }) => {
    // TODO: use middleware instead
    const decoded = jwt.decode(jwtToken);
    const { sid, preferred_username } = decoded as TokenPayload;
    const playerUuid = sid;

    const queueName = `game-events-for-player-${playerUuid}-${gameUuid}`;
    await channel.assertQueue(queueName, { durable: false });
    channel.consume(queueName, (msg) => {
      if (msg) {
        const content = msg.content.toString();
        const data = JSON.parse(content);
        socket.emit("gameEvent", data);
        channel.ack(msg);
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

app.use(cors());
app.use(bodyParser.json());

interface TokenPayload {
  sid: string;
  preferred_username: string;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  const publicKey =
    "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkLRqxmPUDSjL39rbmIrJLXXd9WtlcRMZnylO2Nm7FjCYFdomrzc8zOc1kqIm6dWQZu7wOnNISQpzPQojp9bBLxRgx3bpT2jOEHeLkySVO8MP+rYunDAb989wm2HVqSCI70MnncC0eJrK06xN5M793jdS/SI4830qn59NJOBhXukmX63zmAYi42QQPv27PcA7T6PyY85vTTeDtT4kqa2e4j8sUtxU/b37nHv6TWzAt2Ia862RYMwHM+QTasZnp17+wurRsUciSGPOMedskmj2X3vyfT44cazjQMKmcOmfmoUqGz+YQi9vSYcwnGDVZuGHwC6q6b9L8dFTUR/ZimFxmwIDAQAB\n-----END PUBLIC KEY-----\n";

  // TODO: uncomment when publishing
  // jwt.verify(token, publicKey, { algorithms: ["RS256"] }, (err, decoded) => {
  //   if (err) {
  //     return res.sendStatus(403);
  //   }

  //   const { sid, preferred_username } = decoded as TokenPayload;
  //   req.user = { uuid: sid, username: preferred_username, avatar: "" };
  //   next();
  // });

  const decoded = jwt.decode(token);

  if (!decoded) {
    return res.sendStatus(403);
  }

  const { sid, preferred_username } = decoded as TokenPayload;
  req.user = { uuid: sid, username: preferred_username, avatar: "" };
  next();
};

// Protected endpoint
app.get("/protected", authenticateToken, (req: Request, res: Response) => {
  res.json({ message: "Welcome to the protected area!" });
});

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, world!");
});

let channel: Channel;

app.get(
  "/players/:gameUuid/:uuid",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return;
    }
    const { uuid } = req.user;
    const { gameUuid } = req.params;
    try {
      const data = await realmService.getGameData(gameUuid, uuid);
      res.json(data);
    } catch (error) {
      res.status(404).send(error);
    }
  }
);

async function main() {
  const connection = await connect("amqp://localhost");
  channel = await connection.createChannel();
  //await sendNewPlayerWantsToJoin();
  //await channel.close(); // TODO: do it when service ends
  //await connection.close();
}

const port = 3001;

var realmService = new RealmService(new GeneralEventManager());
realmService
  .start()
  .then(() => {
    console.log("RealmService started");
    server.listen(port, () => {
      console.log(`Server is listening on port ${port}.`);

      main().catch((err) => console.error(err));
    });
  })
  .catch((error) => {
    console.error("Error starting RealmService", error);
  });

app.post(
  "/players/:uuid/play",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return;
    }
    const { uuid } = req.user;
    const { cardIndex, gameUuid } = req.body;

    const message = {
      event: Events.PlayerAttemptsToPlay,
      payload: {
        uuid,
        selectedIndex: cardIndex,
      },
    };
    console.log("msggg", message);
    const buffer = Buffer.from(JSON.stringify(message));
    await channel.publish("", `game-events-${gameUuid}`, buffer);

    res.send("OK");
  }
);

app.post(
  "/subscribe-general",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    if (req.user) {
      const { uuid, username } = req.user;

      const date = new Date();
      const ip = req.ip;

      const message = {
        event: Events.NewViewerWantsToSubscribeGeneral,
        payload: {
          date,
          ip,
          uuid,
          playerName: username,
        },
      };
      const buffer = Buffer.from(JSON.stringify(message));

      try {
        await channel.publish("", `game-events-general`, buffer);
        res.status(200).json({ uuid, message: "Player subscribed general" });
      } catch (err) {
        console.error("Error publishing message", err);
        res.status(500).json({ message: "Error subscribing general" });
      }
    }
  }
);



app.post(
  "/subscribe",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    if (req.user) {
      const { uuid, username } = req.user;
      const { gameUuid } = req.body;

      if (!gameUuid) {
        res.status(500).json({ message: "Please provide a game uuid" });
        return;
      }

      const date = new Date();
      const ip = req.ip;

      const message = {
        event: Events.NewViewerWantsToSubscribe,
        payload: {
          date,
          ip,
          uuid,
          playerName: username,
        },
      };
      const buffer = Buffer.from(JSON.stringify(message));

      try {
        await channel.publish("", `game-events-${gameUuid}`, buffer);
        res.status(200).json({ uuid, message: "Player subscribed the game" });
      } catch (err) {
        console.error("Error publishing message", err);
        res.status(500).json({ message: "Error subscribing the game" });
      }
    }
  }
);

app.post("/join", authenticateToken, async (req: AuthenticatedRequest, res) => {
  if (req.user) {
    const { uuid, username } = req.user;
    const { gameUuid } = req.body;

    if (!gameUuid) {
      res.status(500).json({ message: "Please provide a game uuid" });
      return;
    }

    const date = new Date();
    const ip = req.ip;

    const message = {
      event: Events.NewPlayerWantsToJoin,
      payload: {
        date,
        ip,
        uuid,
        playerName: username,
      },
    };
    const buffer = Buffer.from(JSON.stringify(message));

    try {
      await channel.publish("", `game-events-${gameUuid}`, buffer);
      res.status(200).json({ uuid, message: "Player joined the game" });
    } catch (err) {
      console.error("Error publishing message", err);
      res.status(500).json({ message: "Error joining the game" });
    }
  }
});

app.post(
  "/players/:uuid/start",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return;
    }
    const { uuid } = req.user;
    const { gameUuid } = req.body;

    if (realmService.isGameEnded(gameUuid)) {
      // realmService.stop(gameUuid);
      realmService.restartGame(gameUuid);
      res.send("OK");
    } else {
      const message = {
        event: Events.GameStartRequested,
        payload: {
          uuid,
        },
      };
      const buffer = Buffer.from(JSON.stringify(message));
      await channel.publish("", `game-events-${gameUuid}`, buffer);
      res.send("OK");
    }
  }
);

app.get("/getGames", (req: Request, res: Response) => {
  var eventManagers = realmService.getEventManagers();
  var uuids = [];
  for (var i = 0; i < eventManagers.length; i++) {
    uuids.push(eventManagers[i].uuid);
  }
  res.json(uuids);
});

app.post("/createGame", async (req: Request, res: Response) => {
  var eventManagerUuid = uuidv4(); // TODO: design the classes better so that run listen queue's as callbacks.

  await channel.assertQueue(`game-events-${eventManagerUuid}`);

  await channel.assertQueue(`game-events-exchange-q-${eventManagerUuid}`);

  var eventManager = await realmService.addEventManager(eventManagerUuid);


  const message = {
    event: Events.GeneralUpdateMessage,
    payload: {
      gameUuidList: ["a", "b", "c", "d", "e"]
    },
  };
  const buffer = Buffer.from(JSON.stringify(message));

  try {
    await channel.publish("", `game-events-general`, buffer);
  } catch (err) {
    console.error("Error publishing message", err);
  }


  res.json(eventManager.uuid);
});

app.get("/test", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../src/test.html"));
});
