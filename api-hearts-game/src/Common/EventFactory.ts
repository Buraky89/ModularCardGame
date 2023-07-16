import { Event } from './Event';
import { PayloadFactory } from './PayloadFactory';
import Events from './Events';
import { Player } from './Player';
import GameState from './Enums';

export class EventFactory {
    static newPlayerWantsToJoin(date: Date, ip: string, uuid: string, playerName: string): Event {
        const payload = PayloadFactory.newPlayerWantsToJoin(date, ip, uuid, playerName);
        return new Event(Events.NewPlayerWantsToJoin, payload);
    }

    static generalUpdateMessage(gameUuidList: string[]): Event {
        const payload = PayloadFactory.generalUpdateMessage(gameUuidList);
        return new Event(Events.GeneralUpdateMessage, payload);
    }

    static playerPlayed(uuid: string, selectedIndex: number): Event {
        const payload = PayloadFactory.playerPlayed(uuid, selectedIndex);
        return new Event(Events.PlayerPlayed, payload);
    }

    static newPlayerApprovedToJoin(uuid: string, approvedAt: Date): Event {
        const payload = PayloadFactory.newPlayerApprovedToJoin(uuid, approvedAt);
        return new Event(Events.NewPlayerApprovedToJoin, payload);
    }

    static newViewerApprovedToSubscribe(uuid: string, approvedAt: Date): Event {
        const payload = PayloadFactory.newViewerApprovedToSubscribe(uuid, approvedAt);
        return new Event(Events.NewViewerApprovedToSubscribe, payload);
    }

    static playerAttemptsToPlay(uuid: string, selectedIndex: number): Event {
        const payload = PayloadFactory.playerAttemptsToPlay(uuid, selectedIndex);
        return new Event(Events.PlayerAttemptsToPlay, payload);
    }

    static cardsAreDistributed(): Event {
        const payload = PayloadFactory.cardsAreDistributed();
        return new Event(Events.CardsAreDistributed, payload);
    }

    static gameMessageToPlayer(uuid: string, playerUuid: string, message: string): Event {
        const payload = PayloadFactory.gameMessageToPlayer(uuid, playerUuid, message);
        return new Event(Events.GameMessageToPlayer, payload);
    }

    static gameStartRequested(uuid: string): Event {
        const payload = PayloadFactory.gameStartRequested(uuid);
        return new Event(Events.GameStartRequested, payload);
    }

    static gameStartApproved(uuid: string): Event {
        const payload = PayloadFactory.gameStartApproved(uuid);
        return new Event(Events.GameStartApproved, payload);
    }

    static gameEnded(winner: Player, players: Player[]): Event {
        const payload = PayloadFactory.gameEnded(winner, players);
        return new Event(Events.GameEnded, payload);
    }

    static newViewerWantsToSubscribeGeneral(date: Date, ip: string, uuid: string, username: string): Event {
        const payload = PayloadFactory.newPlayerWantsToJoin(date, ip, uuid, username);
        return new Event(Events.NewViewerWantsToSubscribeGeneral, payload);
    }

    static newViewerWantsToSubscribe(date: Date, ip: string, uuid: string, username: string): Event {
        const payload = PayloadFactory.newPlayerWantsToJoin(date, ip, uuid, username);
        return new Event(Events.NewViewerWantsToSubscribe, payload);
    }

    static generalUpdateMessageExchange(gameUuidList: string[], viewerUuid: string): Event {
        const payload = PayloadFactory.generalUpdateMessageExchange(gameUuidList, viewerUuid);
        return new Event(Events.GeneralUpdateMessageExchange, payload);
    }

    static cardsAreReadyToBeDistributed(): Event {
        return new Event(Events.CardsAreReadyToBeDistributed, PayloadFactory.cardsAreDistributed());
    }

    static gameUpdated(gameUuid: string, data: GameState): Event {
        const payload = { version: PayloadFactory.version, gameUuid, data };
        return new Event(Events.GameUpdated, payload);
    }

    static gameRestarted(): Event {
        const payload = { version: PayloadFactory.version };
        return new Event(Events.GameRestarted, payload);
    }

}
