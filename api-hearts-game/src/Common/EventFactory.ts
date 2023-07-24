import { Event } from './Event';
import { PayloadFactory } from './PayloadFactory';
import Events from './Events';
import { Player } from './Player';
import GameState from './Enums';

export class EventFactory {
    static version: number = 0;
    static versionForGeneralEvents: number = 0;

    static incrementVersion() {
        return this.version++;
    }

    static incrementVersionForGeneralEvents() {
        return this.versionForGeneralEvents++;
    }

    static newPlayerWantsToJoin(date: Date, ip: string, uuid: string, playerName: string): Event {
        const payload = PayloadFactory.newPlayerWantsToJoin(date, ip, uuid, playerName);
        return new Event(Events.NewPlayerWantsToJoin, payload, this.incrementVersion());
    }

    static generalUpdateMessage(gameUuidList: string[]): Event {
        const payload = PayloadFactory.generalUpdateMessage(gameUuidList);
        return new Event(Events.GeneralUpdateMessage, payload, this.incrementVersionForGeneralEvents());
    }

    static playerPlayed(uuid: string, selectedIndex: number): Event {
        const payload = PayloadFactory.playerPlayed(uuid, selectedIndex);
        return new Event(Events.PlayerPlayed, payload, this.incrementVersion());
    }

    static newPlayerApprovedToJoin(uuid: string, approvedAt: Date): Event {
        const payload = PayloadFactory.newPlayerApprovedToJoin(uuid, approvedAt);
        return new Event(Events.NewPlayerApprovedToJoin, payload, this.incrementVersion());
    }

    static newViewerApprovedToSubscribe(uuid: string, approvedAt: Date): Event {
        const payload = PayloadFactory.newViewerApprovedToSubscribe(uuid, approvedAt);
        return new Event(Events.NewViewerApprovedToSubscribe, payload, this.incrementVersion());
    }

    static playerAttemptsToPlay(uuid: string, selectedIndex: number): Event {
        const payload = PayloadFactory.playerAttemptsToPlay(uuid, selectedIndex);
        return new Event(Events.PlayerAttemptsToPlay, payload, this.incrementVersion());
    }

    static cardsAreDistributed(): Event {
        const payload = PayloadFactory.cardsAreDistributed();
        return new Event(Events.CardsAreDistributed, payload, this.incrementVersion());
    }

    static gameMessageToPlayer(uuid: string, playerUuid: string, message: string): Event {
        const payload = PayloadFactory.gameMessageToPlayer(uuid, playerUuid, message);
        return new Event(Events.GameMessageToPlayer, payload, 0); // TODO: invent maybe a new series of version for this, instead of 0.
    }

    static gameStartRequested(uuid: string): Event {
        const payload = PayloadFactory.gameStartRequested(uuid);
        return new Event(Events.GameStartRequested, payload, this.incrementVersion());
    }

    static gameStartApproved(uuid: string): Event {
        const payload = PayloadFactory.gameStartApproved(uuid);
        return new Event(Events.GameStartApproved, payload, this.incrementVersion());
    }

    static gameEnded(winner: Player, players: Player[]): Event {
        const payload = PayloadFactory.gameEnded(winner, players);
        return new Event(Events.GameEnded, payload, this.incrementVersion());
    }

    static newViewerWantsToSubscribeGeneral(date: Date, ip: string, uuid: string, username: string): Event {
        const payload = PayloadFactory.newPlayerWantsToJoin(date, ip, uuid, username);
        return new Event(Events.NewViewerWantsToSubscribeGeneral, payload, this.incrementVersionForGeneralEvents());
    }

    static newViewerWantsToSubscribe(date: Date, ip: string, uuid: string, username: string): Event {
        const payload = PayloadFactory.newPlayerWantsToJoin(date, ip, uuid, username);
        return new Event(Events.NewViewerWantsToSubscribe, payload, this.incrementVersion());
    }

    static generalUpdateMessageExchange(gameUuidList: string[], viewerUuid: string): Event {
        const payload = PayloadFactory.generalUpdateMessageExchange(gameUuidList, viewerUuid);
        return new Event(Events.GeneralUpdateMessageExchange, payload, this.incrementVersionForGeneralEvents());
    }

    static cardsAreReadyToBeDistributed(): Event {
        return new Event(Events.CardsAreReadyToBeDistributed, PayloadFactory.cardsAreDistributed(), this.incrementVersion());
    }

    static gameUpdated(gameUuid: string, data: GameState): Event {
        const payload = { gameUuid, data };
        return new Event(Events.GameUpdated, payload, 0); // TODO: invent maybe a new series of version for this, instead of 0.
    }

    static gameUpdatedEventCreationRequest(gameUuid: string): Event {
        const payload = { gameUuid };
        return new Event(Events.GameUpdatedEventCreationRequest, payload, this.incrementVersion());
    }

    static gameRestarted(): Event {
        const payload = {};
        return new Event(Events.GameRestarted, payload, this.incrementVersion());
    }

}
