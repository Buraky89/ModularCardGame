import { connect, Connection, ConsumeMessage, Channel } from "amqplib";
import { IAmqpService } from "../Interfaces/IAmqpService";
import { QueueNameFactory } from './QueueNameFactory';

class AmqpService implements IAmqpService {
  private connection: Connection | null = null;
  public channel: Channel | null = null;
  private subscribers: { [key: string]: ((msg: ConsumeMessage | null) => void)[] } = {};

  async gameEventsPlayerExchangeQueue(playerUuid: string, gameUuid: string): Promise<string> {
    const queueName = QueueNameFactory.getPlayerQueueName(gameUuid, playerUuid);

    await this.channel?.assertQueue(queueName, { exclusive: true });

    return queueName;
  }

  async start(uuid: string): Promise<void> {
    this.connection = await connect("amqp://localhost");
    this.channel = await this.connection.createChannel();

    await this.channel.assertQueue(QueueNameFactory.getGameEventsQueueName(uuid), { exclusive: true });
    await this.channel.assertQueue(QueueNameFactory.getGameEventsExchangeQueueName(uuid), { exclusive: true });

    this.channel.consume(QueueNameFactory.getGameEventsQueueName(uuid), this.dispatchMessage.bind(this, QueueNameFactory.getGameEventsQueueName(uuid)));
    this.channel.consume(QueueNameFactory.getGameEventsExchangeQueueName(uuid), this.dispatchMessage.bind(this, QueueNameFactory.getGameEventsExchangeQueueName(uuid)));
  }

  async stop(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }
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
    gameUuid: string,
    callback: (msg: ConsumeMessage | null) => void,
    options?: any
  ): Promise<void> {
    console.log("GETTINGGG EXCHANGEQNORMAL");
    return this.subscribe(QueueNameFactory.getGameEventsQueueName(gameUuid), callback, options);
  }

  async subscribeGeneralQueue(
    callback: (msg: ConsumeMessage | null) => void,
    options?: any
  ): Promise<void> {
    return this.subscribe(QueueNameFactory.getGeneralEventsQueueName(), callback, options);
  }

  async subscribeExchangeQueue(
    viewerUuid: string,
    callback: (msg: ConsumeMessage | null) => void,
    options?: any
  ): Promise<void> {
    await this.assertQueue(QueueNameFactory.getGeneralEventsExchangeForPlayersQueueName(viewerUuid));

    return this.subscribe(QueueNameFactory.getGeneralEventsExchangeForPlayersQueueName(viewerUuid), callback, options);
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

  public async publishMessageToGeneralEventsForPlayerExchange(viewerUuid: string, payload: any): Promise<void> {
    await this.publishMessage(payload, QueueNameFactory.getGeneralEventsExchangeForPlayersQueueName(viewerUuid));
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
