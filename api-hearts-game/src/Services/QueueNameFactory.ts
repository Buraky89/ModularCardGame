export class QueueNameFactory {
    static getPlayerQueueName(gameUuid: string, playerUuid: string): string {
        return `game-events-for-player-${playerUuid}-${gameUuid}`;
    }

    static getGameEventsQueueName(uuid: string): string {
        return `game-events-${uuid}`;
    }

    static getGameEventsExchangeQueueName(uuid: string): string {
        return `game-events-exchange-q-${uuid}`;
    }

    static getGeneralEventsExchangeQueueName(): string {
        return `game-events-exchange-q-general`;
    }

    static getGeneralEventsExchangeForPlayersQueueName(viewerUuid: string): string {
        return `game-events-exchange-q-general-${viewerUuid}`;
    }

    static getGeneralEventsQueueName(): string {
        return `game-events-general`;
    }
}
