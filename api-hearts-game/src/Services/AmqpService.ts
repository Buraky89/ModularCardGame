import { connect, Connection, ConsumeMessage, Channel } from "amqplib";
import { IAmqpService } from "../Interfaces/IAmqpService";
import { QueueNameFactory } from './QueueNameFactory';

class AmqpService implements IAmqpService {
  private connection: Connection | null = null;
  public channel: Channel | null = null;
  private subscribers: { [key: string]: ((msg: ConsumeMessage | null) => void)[] } = {};
  private gameEventsQueue: string = "";
  private gameEventsExchangeQueue: string = "";

  async gameEventsPlayerExchangeQueue(playerUuid: string, gameUuid: string): Promise<string> {
    const queueName = QueueNameFactory.getPlayerQueueName(gameUuid, playerUuid);

    await this.channel?.assertQueue(queueName, { durable: false });

    return queueName;
  }

  async start(uuid: string): Promise<void> {
    this.gameEventsQueue = QueueNameFactory.getGameEventsQueueName(uuid);
    this.gameEventsExchangeQueue = QueueNameFactory.getGameEventsExchangeQueueName(uuid);


    this.connection = await connect("amqp://localhost");
    this.channel = await this.connection.createChannel();

    await this.channel.assertQueue(this.gameEventsQueue);
    await this.channel.assertQueue(this.gameEventsExchangeQueue);

    this.channel.consume(this.gameEventsQueue, this.dispatchMessage.bind(this, this.gameEventsQueue));
    this.channel.consume(this.gameEventsExchangeQueue, this.dispatchMessage.bind(this, this.gameEventsExchangeQueue));
  }

  async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }

  async publish(
    exchange: string,
    routingKey: string,
    content: Buffer,
    options?: any
  ): Promise<boolean> {
    return this.channel
      ? this.channel.publish(exchange, routingKey, content, options)
      : false;
  }

  async assertQueue(queue: string, options?: any): Promise<void> {
    if (this.channel) {
      await this.channel.assertQueue(queue, options);
    }
  }

  async sendToQueue(queue: string, content: Buffer): Promise<boolean> {
    return this.channel ? this.channel.sendToQueue(queue, content) : false;
  }

  async sendToPlayerQueue(gameUuid: string, playerUuid: string, content: Buffer): Promise<boolean> {
    return await this.sendToQueue(QueueNameFactory.getPlayerQueueName(gameUuid, playerUuid), content);
  }

  async subscribe(
    queue: string,
    callback: (msg: ConsumeMessage | null) => void,
    options?: any
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.channel) {
        reject(new Error('Channel is not initialized.'));
        return;
      }

      // Add the callback to the subscribers list for the queue
      if (!this.subscribers[queue]) {
        this.subscribers[queue] = [];
      }
      this.subscribers[queue].push(callback);

      try {
        this.channel.consume(queue, (msg) => {
          callback(msg);
        }, options);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async subscribeQueue(
    callback: (msg: ConsumeMessage | null) => void,
    options?: any
  ): Promise<void> {
    return this.subscribe(this.gameEventsQueue, callback, options);
  }

  async subscribeExchangeQueue(
    callback: (msg: ConsumeMessage | null) => void,
    options?: any
  ): Promise<void> {
    return this.subscribe(this.gameEventsExchangeQueue, callback, options);
  }

  async subscribePlayerExchangeQueue(
    playerUuid: string,
    gameUuid: string,
    callback: (msg: ConsumeMessage | null) => void,
    options?: any
  ): Promise<void> {
    return this.subscribe(await this.gameEventsPlayerExchangeQueue(playerUuid, gameUuid), callback, options);
  }

  private dispatchMessage(queue: string, msg: ConsumeMessage | null): void {
    const subscribers = this.subscribers[queue];
    if (subscribers) {
      subscribers.forEach((callback) => callback(msg));
    }
  }

  public async publishMessageToExchange(payload: any, uuid: string): Promise<void> {
    await this.publishMessage(payload, QueueNameFactory.getGameEventsExchangeQueueName(uuid));
  }

  public async publishMessageToGameEvents(payload: any, uuid: string): Promise<void> {
    await this.publishMessage(payload, QueueNameFactory.getGameEventsQueueName(uuid));
  }

  public async publishMessageToGeneralEventsExchange(payload: any): Promise<void> {
    await this.publishMessage(payload, QueueNameFactory.getGeneralEventsExchangeQueueName());
  }

  public async publishMessageToGeneralEvents(payload: any): Promise<void> {
    await this.publishMessage(payload, QueueNameFactory.getGeneralEventsQueueName());
  }

  private async publishMessage(payload: any, queue: string): Promise<void> {
    const buffer = Buffer.from(JSON.stringify(payload));
    await this.publish("", queue, buffer);
  }
}

export { AmqpService };
