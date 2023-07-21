import { Event } from './Event';
import { PayloadFactory } from './PayloadFactory';
import Events from './Events';
import { Player } from './Player';
import GameState from './Enums';

export class EventFactory {
    static version: number = 1;
    static versionForGeneralEvents: number = 1;

    static incrementVersion() {
        this.version++;
    }

    static incrementVersionForGeneralEvents() {
        this.versionForGeneralEvents++;
    }

    static newPlayerWantsToJoin(date: Date, ip: string, uuid: string, playerName: string): Event {
        this.incrementVersionForGeneralEvents();
        const payload = PayloadFactory.newPlayerWantsToJoin(date, ip, uuid, playerName);
        return new Event(Events.NewPlayerWantsToJoin, payload, this.versionForGeneralEvents);
    }

    static generalUpdateMessage(gameUuidList: string[]): Event {
        this.incrementVersionForGeneralEvents();

        const payload = PayloadFactory.generalUpdateMessage(gameUuidList);
        return new Event(Events.GeneralUpdateMessage, payload, this.versionForGeneralEvents);
    }

    static playerPlayed(uuid: string, selectedIndex: number): Event {
        this.incrementVersion();

        const payload = PayloadFactory.playerPlayed(uuid, selectedIndex);
        return new Event(Events.PlayerPlayed, payload, this.version);
    }

    static newPlayerApprovedToJoin(uuid: string, approvedAt: Date): Event {
        this.incrementVersion();

        const payload = PayloadFactory.newPlayerApprovedToJoin(uuid, approvedAt);
        return new Event(Events.NewPlayerApprovedToJoin, payload, this.version);
    }

    static newViewerApprovedToSubscribe(uuid: string, approvedAt: Date): Event {
        this.incrementVersion();

        const payload = PayloadFactory.newViewerApprovedToSubscribe(uuid, approvedAt);
        return new Event(Events.NewViewerApprovedToSubscribe, payload, this.version);
    }

    static playerAttemptsToPlay(uuid: string, selectedIndex: number): Event {
        this.incrementVersion();

        const payload = PayloadFactory.playerAttemptsToPlay(uuid, selectedIndex);
        return new Event(Events.PlayerAttemptsToPlay, payload, this.version);
    }

    static cardsAreDistributed(): Event {
        this.incrementVersion();

        const payload = PayloadFactory.cardsAreDistributed();
        return new Event(Events.CardsAreDistributed, payload, this.version);
    }

    static gameMessageToPlayer(uuid: string, playerUuid: string, message: string): Event {
        this.incrementVersion();

        const payload = PayloadFactory.gameMessageToPlayer(uuid, playerUuid, message);
        return new Event(Events.GameMessageToPlayer, payload, this.version);
    }

    static gameStartRequested(uuid: string): Event {
        this.incrementVersion();

        const payload = PayloadFactory.gameStartRequested(uuid);
        return new Event(Events.GameStartRequested, payload, this.version);
    }

    static gameStartApproved(uuid: string): Event {
        this.incrementVersion();

        const payload = PayloadFactory.gameStartApproved(uuid);
        return new Event(Events.GameStartApproved, payload, this.version);
    }

    static gameEnded(winner: Player, players: Player[]): Event {
        this.incrementVersion();

        const payload = PayloadFactory.gameEnded(winner, players);
        return new Event(Events.GameEnded, payload, this.version);
    }

    static newViewerWantsToSubscribeGeneral(date: Date, ip: string, uuid: string, username: string): Event {
        this.incrementVersionForGeneralEvents();

        const payload = PayloadFactory.newPlayerWantsToJoin(date, ip, uuid, username);
        return new Event(Events.NewViewerWantsToSubscribeGeneral, payload, this.version);
    }

    static newViewerWantsToSubscribe(date: Date, ip: string, uuid: string, username: string): Event {
        this.incrementVersion();

        const payload = PayloadFactory.newPlayerWantsToJoin(date, ip, uuid, username);
        return new Event(Events.NewViewerWantsToSubscribe, payload, this.version);
    }

    static generalUpdateMessageExchange(gameUuidList: string[], viewerUuid: string): Event {
        this.incrementVersionForGeneralEvents();

        const payload = PayloadFactory.generalUpdateMessageExchange(gameUuidList, viewerUuid);
        return new Event(Events.GeneralUpdateMessageExchange, payload, this.versionForGeneralEvents);
    }

    static cardsAreReadyToBeDistributed(): Event {
        this.incrementVersion();

        return new Event(Events.CardsAreReadyToBeDistributed, PayloadFactory.cardsAreDistributed(), this.version);
    }

    static gameUpdated(gameUuid: string, data: GameState): Event {
        this.incrementVersion();

        const payload = { version: this.version, gameUuid, data };
        return new Event(Events.GameUpdated, payload, this.version);
    }

    static gameRestarted(): Event {
        this.incrementVersion();

        const payload = { version: this.version };
        return new Event(Events.GameRestarted, payload, this.version);
    }

}
