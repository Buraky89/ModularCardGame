import { connect, Connection, ConsumeMessage, Channel } from "amqplib";

class AmqpService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  async start(): Promise<Channel> {
    this.connection = await connect("amqp://localhost");
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue("game-events");
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
}

export { AmqpService };
