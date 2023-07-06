import { ConsumeMessage } from "amqplib";

interface IAmqpService {
    start(eventManagerUuid: string): Promise<void>;
    stop(): Promise<void>;
    subscribe(
        queue: string,
        callback: (msg: ConsumeMessage | null) => void,
        options?: any
    ): Promise<void>;
    subscribeQueue(
        gameUuid: string,
        callback: (msg: ConsumeMessage | null) => void,
        options?: any
    ): Promise<void>;
    subscribeGeneralQueue(
        callback: (msg: ConsumeMessage | null) => void,
        options?: any
    ): Promise<void>;
    subscribeExchangeQueue(
        viewerUuid: string,
        callback: (msg: ConsumeMessage | null) => void,
        options?: any
    ): Promise<void>;
    subscribePlayerExchangeQueue(
        playerUuid: string,
        gameUuid: string,
        callback: (msg: ConsumeMessage | null) => void,
        options?: any
    ): Promise<void>;
    publish(
        exchange: string,
        routingKey: string,
        content: Buffer,
        options?: any
    ): Promise<boolean>;
    assertQueue(queue: string, options?: any): Promise<void>;
    sendToQueue(queue: string, content: Buffer): Promise<boolean>;
    sendToPlayerQueue(gameUuid: string, playerUuid: string, content: Buffer): Promise<boolean>;
    publishMessageToExchange(payload: any, uuid: string): Promise<void>;
    publishMessageToGameEvents(payload: any, uuid: string): Promise<void>;
    publishMessageToGeneralEventsExchange(payload: any): Promise<void>;
    publishMessageToGeneralEventsForPlayerExchange(viewerUuid: string, payload: any): Promise<void>;
    publishMessageToGeneralEvents(payload: any): Promise<void>;
}

export { IAmqpService };
