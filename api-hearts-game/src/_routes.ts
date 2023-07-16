import { Express, Request, Response, Router } from "express";
import { authenticateToken, AuthenticatedRequest } from "./_jwtMiddleware"; // assuming app.ts
import { errorHandler, AsyncWrapper } from "./middleware/errorHandling";
import { RealmService } from "./Services/RealmService";
import path from "path";
import { EventFactory } from "./Common/EventFactory";

const router = Router();


export function registerRoutes(app: Express, realmService: RealmService) {
    app.use(authenticateToken);

    router.get("/protected", authenticateToken, (req: Request, res: Response) => {
        res.json({ message: "Welcome to the protected area!" });
    });

    router.get("/", (req: Request, res: Response) => {
        res.json({ message: "Hello, world!" });
    });

    router.get(
        "/players/:gameUuid/:uuid",
        authenticateToken,
        AsyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
            if (!req.user) {
                return;
            }

            const { uuid: userUuid } = req.user;
            const { gameUuid } = req.params;

            const data = await realmService.getGameData(gameUuid, userUuid);

            res.json(data);
        })
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

            const message = EventFactory.playerAttemptsToPlay(uuid, cardIndex);

            realmService.publishMessageToGameEvents(message, gameUuid);

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

                const message = EventFactory.newViewerWantsToSubscribeGeneral(date, ip, uuid, username);

                try {
                    await realmService.publishMessageToGeneralEvents(message);
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

                const message = EventFactory.newViewerWantsToSubscribe(date, ip, uuid, username);

                try {
                    realmService.publishMessageToGameEvents(message, gameUuid);
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

            const message = EventFactory.newPlayerWantsToJoin(date, ip, uuid, username);

            try {
                realmService.publishMessageToGameEvents(message, gameUuid);
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
                const message = EventFactory.gameStartRequested(uuid);
                realmService.publishMessageToGameEvents(message, gameUuid);
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
        var eventManager = await realmService.addEventManager();

        res.json(eventManager.uuid);
    });

    app.get("/test", (req: Request, res: Response) => {
        res.sendFile(path.join(__dirname, "../src/test.html"));
    });

}

router.use(errorHandler);

export default router;