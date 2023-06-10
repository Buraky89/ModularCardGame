import { connect, Connection, ConsumeMessage, Channel } from "amqplib";
import { IAmqpService } from "../Interfaces/IAmqpService";

class AmqpService implements IAmqpService {
  private connection: Connection | null = null;
  public channel: Channel | null = null;
  private subscribers: { [key: string]: ((msg: ConsumeMessage | null) => void)[] } = {};
  private gameEventsQueue: string = "";
  private gameEventsExchangeQueue: string = "";

  async start(uuid: string): Promise<Channel> {
    this.gameEventsQueue = `game-events-${uuid}`;
    this.gameEventsExchangeQueue = `game-events-exchange-q-${uuid}`;

    this.connection = await connect("amqp://localhost");
    this.channel = await this.connection.createChannel();

    await this.channel.assertQueue(this.gameEventsQueue);
    await this.channel.assertQueue(this.gameEventsExchangeQueue);

    this.channel.consume(this.gameEventsQueue, this.dispatchMessage.bind(this, this.gameEventsQueue));
    this.channel.consume(this.gameEventsExchangeQueue, this.dispatchMessage.bind(this, this.gameEventsExchangeQueue));

    return this.channel;
  }

  async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }

  async consume(
    queue: string,
    onMessage: (msg: ConsumeMessage | null) => void,
    options?: any
  ): Promise<void> {
    if (this.channel) {
      await this.channel.consume(queue, onMessage, options);
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

  private dispatchMessage(queue: string, msg: ConsumeMessage | null): void {
    const subscribers = this.subscribers[queue];
    if (subscribers) {
      subscribers.forEach((callback) => callback(msg));
    }
  }
}

export { AmqpService };
