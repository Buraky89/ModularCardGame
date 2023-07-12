import { connect, Connection, ConsumeMessage, Channel } from "amqplib";
import { IAmqpService } from "../Interfaces/IAmqpService";
import { QueueNameFactory } from './QueueNameFactory';

class AmqpService implements IAmqpService {
  private connection: Connection | null = null;
  public channel: Channel | null = null;
  private queues: Set<string> = new Set();

  async start(): Promise<void> {
    this.connection = await connect("amqp://localhost");
    this.channel = await this.connection.createChannel();
  }

  async stop(): Promise<void> {
    if (this.channel) {
      await Promise.all(
        Array.from(this.queues.values()).map(queue => this.channel!.deleteQueue(queue))
      );
      await this.channel.close();
      this.channel = null;
    }
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }

  handleExit(signal: NodeJS.Signals) {
    console.log(`Received ${signal}. Closing connections and deleting queues...`);
    this.stop().then(() => {
      console.log("All queues deleted, connections closed. Exiting now.");
      process.exit(0);
    });
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


  async subscribe(
    queue: string,
    callback: (msg: ConsumeMessage | null) => void,
    options?: any
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (!this.channel) {
        reject(new Error('Channel is not initialized.'));
        return;
      }

      // Assert the queue before consuming from it
      await this.channel.assertQueue(queue, { exclusive: true });

      this.queues.add(queue);

      try {
        this.channel.consume(queue, (msg) => {
          callback(msg);
          if (msg) {
            try {
              this.channel?.ack(msg);
            } catch (error) {

            }
          }
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
    return this.subscribe(QueueNameFactory.getGameEventsQueueName(gameUuid), callback, options);
  }

  async subscribeExchange(
    gameUuid: string,
    callback: (msg: ConsumeMessage | null) => void,
    options?: any
  ): Promise<void> {
    return this.subscribe(QueueNameFactory.getGameEventsExchangeQueueName(gameUuid), callback, options);
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
    return this.subscribe(QueueNameFactory.getGeneralEventsExchangeForPlayersQueueName(viewerUuid), callback, options);
  }

  async subscribePlayerExchangeQueue(
    playerUuid: string,
    gameUuid: string,
    callback: (msg: ConsumeMessage | null) => void,
    options?: any
  ): Promise<void> {
    return this.subscribe(QueueNameFactory.getPlayerQueueName(gameUuid, playerUuid), callback, options);
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

  public async publishMessageToPlayerQueue(gameUuid: string, playerUuid: string, content: any): Promise<void> {
    await this.publishMessage(content, QueueNameFactory.getPlayerQueueName(gameUuid, playerUuid));
  }

  private async publishMessage(payload: any, queue: string): Promise<void> {
    const buffer = Buffer.from(JSON.stringify(payload));
    await this.publish("", queue, buffer);
  }
}

export { AmqpService };
