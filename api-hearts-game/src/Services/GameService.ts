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

class PlayerService {
  private players: string[] = [];

  addPlayer(uuid: string) {
    this.players.push(uuid);
  }

  getPlayers() {
    return this.players;
  }
}

class GameService {
  private playerService: PlayerService = new PlayerService();
  private connection: Connection | null = null;

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
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }

  async handleMessage(msg: any): Promise<void> {
    const message = JSON.parse(msg.content.toString());
    console.log(`Received message: ${JSON.stringify(message)}`);
    this.handleEvent(message);
  }

  handleEvent(message: any): void {
    const { event, payload } = message;

    switch (event) {
      case Events.NewPlayerWantsToJoin:
        this.handleNewPlayerWantsToJoin(payload);
        break;
      case Events.PlayerPlayed:
        this.handlePlayerPlayed(payload);
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
    this.playerService.addPlayer(uuid);
  }

  private handlePlayerPlayed(payload: PlayerPlayedPayload): void {
    const { uuid, selectedIndex } = payload;
    console.log(`Player ${uuid} played card ${selectedIndex}`);
  }
}

export { GameService, PlayerService };
