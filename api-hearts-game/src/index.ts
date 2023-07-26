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
    })
    .catch((error) => {
      console.error("Error starting RealmService", error);
    });


  process.on('SIGINT', async () => {
    console.log('SIGINT signal received. Closing AMQP connection...');
    await amqpService.handleExit('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received. Closing AMQP connection...');
    await amqpService.handleExit('SIGTERM');
    process.exit(0);
  });

  process.on('uncaughtException', async (err) => {
    console.error(`Uncaught Exception: ${err.stack || err}`);
    await amqpService.stop();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    await amqpService.stop();
    process.exit(1);
  });
});

/* TODO: fix (node:1025) UnhandledPromiseRejectionWarning: Error: connect ECONNREFUSED 127.0.0.1:5672
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1146:16)
    (Use `node --trace-warnings ...` to show where the warning was created)
    (node:1025) UnhandledPromiseRejectionWarning: Unhandled promise rejection. This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). To terminate the node process on unhandled promise rejection, use the CLI flag `--unhandled-rejections=strict` (see https://nodejs.org/api/cli.html#cli_unhandled_rejections_mode). (rejection id: 1)
    (node:1025) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.
*/