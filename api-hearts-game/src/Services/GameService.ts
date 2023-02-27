import { connect, Connection, ConsumeMessage } from "amqplib";
import { v4 as uuidv4 } from "uuid";
import { PlayerService } from "./PlayerService";
import Events from "../Common/Events";
import {
  NewPlayerWantsToJoinPayload,
  PlayerPlayedPayload,
  NewPlayerApprovedToJoinPayload,
} from "../Common/Payloads";

class GameService {
  private playerService: PlayerService;
  private connection: Connection | null = null;

  constructor() {
    this.playerService = new PlayerService();
  }

  async start(): Promise<void> {
    this.connection = await connect("amqp://localhost");
    const channel = await this.connection.createChannel();
    await channel.assertQueue("game-events");

    // Pass channel object to PlayerService instance
    await this.playerService.start(channel);

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
        this.handleNewPlayerWantsToJoin(payload as NewPlayerWantsToJoinPayload);
        break;
      case Events.PlayerPlayed:
        this.handlePlayerPlayed(payload as PlayerPlayedPayload);
        break;
      case Events.NewPlayerApprovedToJoin:
        this.handleNewPlayerApprovedToJoin(
          payload as NewPlayerApprovedToJoinPayload
        );
        break;
      default:
        throw new Error(`Invalid event: ${event}`);
    }
  }

  private handleNewPlayerWantsToJoin(
    payload: NewPlayerWantsToJoinPayload
  ): void {
    const { date, ip, uuid, playerName } = payload;
    this.playerService.addPlayer(playerName, uuid);
  }

  private handlePlayerPlayed(payload: PlayerPlayedPayload): void {
    const { uuid, selectedIndex } = payload;
    console.log(`Player ${uuid} played card ${selectedIndex}`);
  }

  private handleNewPlayerApprovedToJoin(
    payload: NewPlayerApprovedToJoinPayload
  ): void {
    const { uuid } = payload;
    console.log(`New player ${uuid} approved to join`);
    // Do something with the approved player
  }
}

export { GameService };
