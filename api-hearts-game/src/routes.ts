import { Express, Request, Response, NextFunction, Router } from "express";
import { authenticateToken, AuthenticatedRequest } from "./index"; // assuming app.ts
import { Channel } from "amqplib";
import { RealmService } from "./Services/RealmService";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import Events from "./Common/Events";

export function registerRoutes(app: Express, channel: Channel, realmService: RealmService) {
    app.get("/protected", authenticateToken, (req: Request, res: Response) => {
        res.json({ message: "Welcome to the protected area!" });
    });

    app.get("/", (req: Request, res: Response) => {
        res.send("Hello, world!");
    });

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

        res.json(eventManager.uuid);
    });

    app.get("/test", (req: Request, res: Response) => {
        res.sendFile(path.join(__dirname, "../src/test.html"));
    });

}