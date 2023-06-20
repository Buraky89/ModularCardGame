import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import { RealmService } from "./Services/RealmService";
import cors from "cors";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { createServer } from "http";
import { GeneralEventManager } from "./Services/GeneralEventManager";
import { registerRoutes } from "./routes";
import Events from "./Common/Events";

export interface AuthenticatedRequest extends Request {
  user?: {
    uuid: string;
    username: string;
    avatar: string;
  };
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // adjust this to your specific origin
    methods: ["GET", "POST"],
  },
});


async function handleMessage(socket: any, playerUuid: string, msg: any): Promise<void> {
  const message = JSON.parse(msg.content.toString());
  console.log(`Received message for exchange: ${JSON.stringify(message)}`);
  await handleEvent(socket, playerUuid, message);
}

async function handleEvent(socket: any, playerUuid: string, message: any): Promise<void> {
  const { event, payload } = message;

  switch (event) {
    case Events.GeneralUpdateMessageExchange:

      if (JSON.stringify(payload).indexOf(playerUuid) > -1) {
        socket.emit("generalEvent", message);
        // TODO: channel.ack(msg);
      }

      break;
    default:
      throw new Error(`Invalid event: ${event}`);
  }
}

async function handlePlayerMessage(socket: any, playerUuid: string, gameUuid: string, msg: any): Promise<void> {
  const message = JSON.parse(msg.content.toString());
  console.log(`Received message for player exchange: ${JSON.stringify(message)}`);
  await handlePlayerEvent(socket, playerUuid, gameUuid, message);
}

async function handlePlayerEvent(socket: any, playerUuid: string, gameUuid: string, message: any): Promise<void> {
  socket.emit("gameEvent", message);
  // TODO: channel.ack(message);
}

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

  socket.on("joinGeneralEventQueue", async ({ jwtToken }) => {
    // TODO: use middleware instead
    const decoded = jwt.decode(jwtToken);
    const { sid, preferred_username } = decoded as TokenPayload;
    const playerUuid = sid;

    await realmService.generalEventManager?.subscribeExchangeQueue(handleMessage.bind(this, socket, playerUuid));
  });

  socket.on("joinGameEventQueue", async ({ jwtToken, gameUuid }) => {
    // TODO: use middleware instead
    const decoded = jwt.decode(jwtToken);
    const { sid, preferred_username } = decoded as TokenPayload;
    const playerUuid = sid;

    await realmService.generalEventManager?.subscribePlayerExchangeQueue(playerUuid, gameUuid, handlePlayerMessage.bind(this, socket, playerUuid, gameUuid));
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

const port = 3001;

var realmService = new RealmService(new GeneralEventManager());
realmService
  .start()
  .then(() => {
    console.log("RealmService started");
    server.listen(port, () => {
      console.log(`Server is listening on port ${port}.`);

      registerRoutes(app, realmService);
    });
  })
  .catch((error) => {
    console.error("Error starting RealmService", error);
  });

