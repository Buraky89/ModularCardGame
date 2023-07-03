import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { createServer } from "http";
import dotenv from 'dotenv';
import { config } from './_config';
import { GeneralEventManager } from "./Services/GeneralEventManager";
import { RealmService } from "./Services/RealmService";
import { registerRoutes } from "./_routes";
import { registerSocket } from "./_socket";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors(config.corsOptions));
app.use(bodyParser.json());

const port = config.port;

var realmService = new RealmService(new GeneralEventManager());
realmService
  .start()
  .then(() => {
    console.log("RealmService started");
    server.listen(port, () => {
      console.log(`Server is listening on port ${port}.`);

      registerRoutes(app, realmService);
      registerSocket(io, realmService);
    });
  })
  .catch((error) => {
    console.error("Error starting RealmService", error);
  });

process.on('SIGINT', async () => {
  console.log('SIGINT signal received. Closing AMQP connection...');
  await realmService.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Closing AMQP connection...');
  await realmService.stop();
  process.exit(0);
});

process.on('uncaughtException', async (err) => {
  console.error(`Uncaught Exception: ${err.stack || err}`);
  await realmService.stop();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  await realmService.stop();
  process.exit(1);
});