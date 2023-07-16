import {
    NewPlayerWantsToJoinPayload,
    PlayerPlayedPayload,
    NewPlayerApprovedToJoinPayload,
    PlayerAttemptsToPlayPayload,
    GameEndedPayload,
    GameStartRequestedPayload,
    GameStartApprovedPayload,
    NewViewerApprovedToSubscribePayload,
    CardsAreDistributedPayload,
    GameMessageToPlayerPayload,
    GeneralUpdateMessagePayload,
    GeneralUpdateMessageExchangePayload,
} from "../Common/Payloads";
import { Player } from "./Player";

export class PayloadFactory {
    static version: number = 1;

    static newPlayerWantsToJoin(date: Date, ip: string, uuid: string, playerName: string): NewPlayerWantsToJoinPayload {
        return {
            version: this.version,
            date,
            ip,
            uuid,
            playerName,
        };
    }

    static generalUpdateMessage(gameUuidList: string[]): GeneralUpdateMessagePayload {
        return {
            version: this.version,
            gameUuidList,
        };
    }

    static playerPlayed(uuid: string, selectedIndex: number): PlayerPlayedPayload {
        return {
            version: this.version,
            uuid,
            selectedIndex,
        };
    }

    static newPlayerApprovedToJoin(uuid: string, approvedAt: Date): NewPlayerApprovedToJoinPayload {
        return {
            version: this.version,
            uuid,
            approvedAt,
        };
    }

    static newViewerApprovedToSubscribe(uuid: string, approvedAt: Date): NewViewerApprovedToSubscribePayload {
        return {
            version: this.version,
            uuid,
            approvedAt,
        };
    }

    static playerAttemptsToPlay(uuid: string, selectedIndex: number): PlayerAttemptsToPlayPayload {
        return {
            version: this.version,
            uuid,
            selectedIndex,
        };
    }

    static cardsAreDistributed(): CardsAreDistributedPayload {
        return {
            version: this.version,
        };
    }

    static gameMessageToPlayer(uuid: string, playerUuid: string, message: string): GameMessageToPlayerPayload {
        return {
            version: this.version,
            uuid,
            playerUuid,
            message,
        };
    }

    static gameStartRequested(uuid: string): GameStartRequestedPayload {
        return {
            version: this.version,
            uuid,
        };
    }

    static gameStartApproved(uuid: string): GameStartApprovedPayload {
        return {
            version: this.version,
            uuid,
        };
    }

    static gameEnded(winner: Player, players: Player[]): GameEndedPayload {
        return {
            version: this.version,
            winner,
            players,
        };
    }

    static generalUpdateMessageExchange(gameUuidList: string[], viewerUuid: string): GeneralUpdateMessageExchangePayload {
        return {
            version: this.version,
            gameUuidList,
            viewerUuid,
        };
    }
}
