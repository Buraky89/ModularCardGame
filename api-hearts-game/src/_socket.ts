import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Events from "./Common/Events";
import { RealmService } from "./Services/RealmService";

interface TokenPayload {
    sid: string;
    preferred_username: string;
}

export function registerSocket(io: Server, realmService: RealmService) {
    // TODO: maybe use the jwt verification method in _jwtMiddleware

    async function handlePlayerMessage(socket: any, playerUuid: string, gameUuid: string, msg: any): Promise<void> {
        const message = JSON.parse(msg.content.toString());
        console.log(`Received message for player exchange: ${JSON.stringify(message)}`);
        await handlePlayerEvent(socket, playerUuid, gameUuid, message);
    }
    async function handlePlayerEvent(socket: any, playerUuid: string, gameUuid: string, message: any): Promise<void> {
        socket.emit("gameEvent", message);
        // TODO: channel.ack(message);
    }

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

            await realmService.generalEventManager?.subscribeExchangeQueue(handleMessage.bind(null, socket, playerUuid));
        });

        socket.on("joinGameEventQueue", async ({ jwtToken, gameUuid }) => {
            // TODO: use middleware instead
            const decoded = jwt.decode(jwtToken);
            const { sid, preferred_username } = decoded as TokenPayload;
            const playerUuid = sid;

            await realmService.generalEventManager?.subscribePlayerExchangeQueue(playerUuid, gameUuid, handlePlayerMessage.bind(null, socket, playerUuid, gameUuid));
        });


        socket.on("disconnect", () => {
            console.log("User disconnected", socket.id);
        });
    });
}
