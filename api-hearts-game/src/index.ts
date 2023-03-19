import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import { EventManager } from "./Services/EventManager";
import { connect, Channel } from "amqplib";
import Events from "./Common/Events";
import cors from "cors";
import { UserManager } from "./Services/UserManager";
import jwt from "jsonwebtoken";

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

app.use(cors());
app.use(bodyParser.json());

const userManager = new UserManager("my-secret");

// Login endpoint
app.post("/login", (req: Request, res: Response) => {
  const { username, avatar } = req.body;
  const user = userManager.createUser(username, avatar);
  const token = userManager.issueToken(user);
  res.json({ token });
});

interface TokenPayload {
  uuid: string;
  username: string;
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

  jwt.verify(token, "my-secret", (err, decoded) => {
    if (err) {
      return res.sendStatus(403);
    }

    const { uuid, username } = decoded as TokenPayload;
    req.user = { uuid, username, avatar: "" };
    next();
  });
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
  "/players/:uuid",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return;
    }
    const { uuid } = req.user;
    try {
      const data = await eventManager.getGameData(uuid);
      res.json(data);
    } catch (error) {
      res.status(404).send(error);
    }
  }
);

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

app.post(
  "/players/:uuid/play",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return;
    }
    const { uuid } = req.user;
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
  }
);

app.post("/join", authenticateToken, async (req: AuthenticatedRequest, res) => {
  if (req.user) {
    const { uuid, username } = req.user;
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
      await channel.publish("", "game-events", buffer);
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

    if (eventManager.isGameEnded()) {
      eventManager.stop();
      eventManager.restartGame();
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
  }
);
