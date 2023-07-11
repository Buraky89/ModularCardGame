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
import { HeartsPlayerService } from "./Services/HeartsPlayerService";
import { HeartsGameService } from "./Services/HeartsGameService";
import { WinstonLogger } from "./Common/WinstonLogger";
import { AmqpService } from "./Services/AmqpService";

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

const heartsPlayerService = new HeartsPlayerService();
const heartsGameService = new HeartsGameService(heartsPlayerService);

const logger = new WinstonLogger();

const amqpService = new AmqpService();
amqpService.start().then(() => {
  var realmService = new RealmService(new GeneralEventManager(amqpService), heartsGameService, logger, amqpService);
  realmService
    .start()
    .then(() => {
      console.log("RealmService started");
      server.listen(port, () => {
        console.log(`Server is listening on port ${port}.`);

        registerRoutes(app, realmService);
        registerSocket(io, realmService);
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
    })
    .catch((error) => {
      console.error("Error starting RealmService", error);
    });
});

// TODO: player 1 does not get socket updates. dont know why... but always player 1.

