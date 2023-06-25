import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { createServer } from "http";
import dotenv from 'dotenv';
import { config } from './_config';
import { GeneralEventManager } from "./Services/GeneralEventManager";
import { RealmService } from "./Services/RealmService";
import { registerRoutes } from "./_routes";

dotenv.config();

const app = express();
const server = createServer(app);

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

      // TODO: what to do next? currently the game creation is not transferred to the other chars. go to the old commits and find out where it's broken. fix it...
      // TODO: game joining is also not working...
      registerRoutes(app, realmService);
    });
  })
  .catch((error) => {
    console.error("Error starting RealmService", error);
  });