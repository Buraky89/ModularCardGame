import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Events from "./Common/Events";
import { RealmService } from "./Services/RealmService";
import { authenticateToken, AuthenticatedRequest, TokenPayload, toTokenPayload } from "./_jwtMiddleware"; // assuming app.ts


export function registerSocket(io: Server, realmService: RealmService) {
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
                socket.emit("generalEvent", message);
                break;
            default:
                throw new Error(`Invalid event: ${event}, message: ${message}`);
        }
    }


    io.on("connection", (socket) => {
        console.log("User connected", socket.id);

        socket.on("joinGeneralEventQueue", async ({ jwtToken }) => {
            const tokenPayload = toTokenPayload(jwtToken);
            const playerUuid = tokenPayload.sid;

            await realmService.generalEventManager?.subscribeExchangeQueue(playerUuid, handleMessage.bind(null, socket, playerUuid));
        });

        socket.on("joinGameEventQueue", async ({ jwtToken, gameUuid }) => {
            const tokenPayload = toTokenPayload(jwtToken);
            const playerUuid = tokenPayload.sid;

            await realmService.generalEventManager?.subscribePlayerExchangeQueue(playerUuid, gameUuid, handlePlayerMessage.bind(null, socket, playerUuid, gameUuid));
        });


        socket.on("disconnect", () => {
            console.log("User disconnected", socket.id);
        });
    });
}
