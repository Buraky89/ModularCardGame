import express, { Request, Response } from "express";
import bodyParser from "body-parser";

const app = express();

app.use(bodyParser.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, world!");
});

const port = 3001;

app.listen(port, () => {
  console.log(`Server is listening on port ${port}.`);
});
