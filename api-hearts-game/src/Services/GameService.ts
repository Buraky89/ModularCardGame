import { connect, Connection, ConsumeMessage } from "amqplib";
import { v4 as uuidv4 } from "uuid";

enum Events {
  NewPlayerWantsToJoin = "NewPlayerWantsToJoin",
  PlayerPlayed = "PlayerPlayed",
}

interface NewPlayerWantsToJoinPayload {
  date: Date;
  ip: string;
  uuid: string;
}

interface PlayerPlayedPayload {
  uuid: string;
  selectedIndex: number;
}

class GameService {
  private players: string[] = [];
  private connection: Connection;

  constructor() {}

  async start(): Promise<void> {
    this.connection = await connect("amqp://localhost");
    const channel = await this.connection.createChannel();
    await channel.assertQueue("game-events");
    await channel.consume("game-events", this.handleMessage.bind(this), {
      noAck: true,
    });
  }

  async stop(): Promise<void> {
    await this.connection.close();
  }

  handleMessage(message: ConsumeMessage | null): void {
    if (message) {
      const event = message.properties.headers.event;
      const payload = JSON.parse(message.content.toString());
      this.handleEvent(event, payload);
    }
  }

  handleEvent(
    event: Events,
    payload: NewPlayerWantsToJoinPayload | PlayerPlayedPayload
  ): void {
    switch (event) {
      case Events.NewPlayerWantsToJoin:
        this.handleNewPlayerWantsToJoin(payload as NewPlayerWantsToJoinPayload);
        break;
      case Events.PlayerPlayed:
        this.handlePlayerPlayed(payload as PlayerPlayedPayload);
        break;
      default:
        throw new Error(`Invalid event: ${event}`);
    }
  }

  private handleNewPlayerWantsToJoin(
    payload: NewPlayerWantsToJoinPayload
  ): void {
    const { date, ip, uuid } = payload;
    console.log(`New player wants to join: ${uuid} (${ip}), joined at ${date}`);
    this.players.push(uuid);
  }

  private handlePlayerPlayed(payload: PlayerPlayedPayload): void {
    const { uuid, selectedIndex } = payload;
    console.log(`Player ${uuid} played card ${selectedIndex}`);
  }
}

export { GameService };
