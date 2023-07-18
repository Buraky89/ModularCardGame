// import { Mutex } from "async-mutex";
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
    // static versionMutex: Mutex = new Mutex();
    // static versionPromise: Promise<void> = Promise.resolve();

    // TODO: be it this old the other version, this wall of text is coming always
    static incrementVersion() {
        this.version++;
        // this.versionPromise = this.versionPromise
        //     .then(() => this.versionMutex.acquire())
        //     .then(release => {
        //         try {
        //             this.version += 1;
        //         } finally {
        //             release();
        //         }
        //     });
    }

    static newPlayerWantsToJoin(date: Date, ip: string, uuid: string, playerName: string): NewPlayerWantsToJoinPayload {
        this.incrementVersion();

        return {
            version: this.version,
            date,
            ip,
            uuid,
            playerName,
        };
    }

    static generalUpdateMessage(gameUuidList: string[]): GeneralUpdateMessagePayload {
        this.incrementVersion();

        return {
            version: this.version,
            gameUuidList,
        };
    }

    static playerPlayed(uuid: string, selectedIndex: number): PlayerPlayedPayload {
        this.incrementVersion();

        return {
            version: this.version,
            uuid,
            selectedIndex,
        };
    }

    static newPlayerApprovedToJoin(uuid: string, approvedAt: Date): NewPlayerApprovedToJoinPayload {
        this.incrementVersion();

        return {
            version: this.version,
            uuid,
            approvedAt,
        };
    }

    static newViewerApprovedToSubscribe(uuid: string, approvedAt: Date): NewViewerApprovedToSubscribePayload {
        this.incrementVersion();

        return {
            version: this.version,
            uuid,
            approvedAt,
        };
    }

    static playerAttemptsToPlay(uuid: string, selectedIndex: number): PlayerAttemptsToPlayPayload {
        this.incrementVersion();

        return {
            version: this.version,
            uuid,
            selectedIndex,
        };
    }

    static cardsAreDistributed(): CardsAreDistributedPayload {
        this.incrementVersion();

        return {
            version: this.version,
        };
    }

    static gameMessageToPlayer(uuid: string, playerUuid: string, message: string): GameMessageToPlayerPayload {
        this.incrementVersion();

        return {
            version: this.version,
            uuid,
            playerUuid,
            message,
        };
    }

    static gameStartRequested(uuid: string): GameStartRequestedPayload {
        this.incrementVersion();

        return {
            version: this.version,
            uuid,
        };
    }

    static gameStartApproved(uuid: string): GameStartApprovedPayload {
        this.incrementVersion();

        return {
            version: this.version,
            uuid,
        };
    }

    static gameEnded(winner: Player, players: Player[]): GameEndedPayload {
        this.incrementVersion();

        return {
            version: this.version,
            winner,
            players,
        };
    }

    static generalUpdateMessageExchange(gameUuidList: string[], viewerUuid: string): GeneralUpdateMessageExchangePayload {
        this.incrementVersion();

        return {
            version: this.version,
            gameUuidList,
            viewerUuid,
        };
    }
}
