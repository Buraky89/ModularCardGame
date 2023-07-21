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
    static newPlayerWantsToJoin(date: Date, ip: string, uuid: string, playerName: string): NewPlayerWantsToJoinPayload {
        return {
            date,
            ip,
            uuid,
            playerName,
        };
    }

    static generalUpdateMessage(gameUuidList: string[]): GeneralUpdateMessagePayload {
        return {
            gameUuidList,
        };
    }

    static playerPlayed(uuid: string, selectedIndex: number): PlayerPlayedPayload {
        return {
            uuid,
            selectedIndex,
        };
    }

    static newPlayerApprovedToJoin(uuid: string, approvedAt: Date): NewPlayerApprovedToJoinPayload {
        return {
            uuid,
            approvedAt,
        };
    }

    static newViewerApprovedToSubscribe(uuid: string, approvedAt: Date): NewViewerApprovedToSubscribePayload {
        return {
            uuid,
            approvedAt,
        };
    }

    static playerAttemptsToPlay(uuid: string, selectedIndex: number): PlayerAttemptsToPlayPayload {
        return {
            uuid,
            selectedIndex,
        };
    }

    static cardsAreDistributed(): CardsAreDistributedPayload {
        return {
        };
    }

    static gameMessageToPlayer(uuid: string, playerUuid: string, message: string): GameMessageToPlayerPayload {
        return {
            uuid,
            playerUuid,
            message,
        };
    }

    static gameStartRequested(uuid: string): GameStartRequestedPayload {
        return {
            uuid,
        };
    }

    static gameStartApproved(uuid: string): GameStartApprovedPayload {
        return {
            uuid,
        };
    }

    static gameEnded(winner: Player, players: Player[]): GameEndedPayload {
        return {
            winner,
            players,
        };
    }

    static generalUpdateMessageExchange(gameUuidList: string[], viewerUuid: string): GeneralUpdateMessageExchangePayload {
        return {
            gameUuidList,
            viewerUuid,
        };
    }
}
