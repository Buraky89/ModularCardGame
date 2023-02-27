import { Channel } from "amqplib";
import Events from "../Common/Events";
import { v4 as uuidv4 } from "uuid";
import { Player } from "../Common/Player";

class PlayerService {
  private players: Player[] = [];
  private channel: Channel | null = null;

  constructor() {}

  async start(channel: Channel): Promise<void> {
    this.channel = channel;
  }

  async addPlayer(playerName: string, uuid: string): Promise<void> {
    const player = new Player(playerName, uuid);
    this.players.push(player);
    console.log(`Player added: ${uuid}`);

    // Publish NewPlayerApprovedToJoin event
    if (this.channel) {
      const message = {
        event: Events.NewPlayerApprovedToJoin,
        payload: {
          uuid,
        },
      };
      const buffer = Buffer.from(JSON.stringify(message));
      await this.channel.publish("", "game-events", buffer);
    }
  }
}

export { PlayerService };
