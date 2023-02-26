import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { GameService } from "./Services/GameService";

const app = express();

app.use(bodyParser.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, world!");
});

const port = 3001;

const gameService = new GameService();
gameService
  .start()
  .then(() => {
    console.log("GameService started");
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}.`);
    });
  })
  .catch((error) => {
    console.error("Error starting GameService", error);
  });
