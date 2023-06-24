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
        callback: (msg: ConsumeMessage | null) => void,
        options?: any
    ): Promise<void>;
    subscribeExchangeQueue(
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
}

export { IAmqpService };
