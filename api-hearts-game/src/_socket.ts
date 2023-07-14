import { Server } from "socket.io";
import Events from "./Common/Events";
import { RealmService } from "./Services/RealmService";
import { toTokenPayload } from "./_jwtMiddleware";


export function registerSocket(io: Server, realmService: RealmService) {
    async function handlePlayerMessage(socket: any, playerUuid: string, gameUuid: string, msg: any): Promise<void> {
        const message = JSON.parse(msg.content.toString());
        const printableMessage = JSON.stringify(message);
        console.log(`Received message for player exchange: ${printableMessage.length > 250 ? (printableMessage.substring(0, 250) + "...") : printableMessage}`);
        await handlePlayerEvent(socket, playerUuid, gameUuid, message);
    }
    async function handlePlayerEvent(socket: any, playerUuid: string, gameUuid: string, message: any): Promise<void> {
        socket.emit("gameEvent", message);
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

            await realmService.getEventManager(gameUuid).subscribePlayerExchangeQueue(playerUuid, gameUuid, handlePlayerMessage.bind(null, socket, playerUuid, gameUuid));
        });


        socket.on("disconnect", () => {
            console.log("User disconnected", socket.id);
        });
    });
}
