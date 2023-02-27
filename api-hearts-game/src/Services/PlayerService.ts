import { Channel } from "amqplib";
import Events from "../Common/Events";

class PlayerService {
  private players: string[] = [];
  private channel: Channel | null = null;

  constructor() {}

  async start(channel: Channel): Promise<void> {
    this.channel = channel;
  }

  async addPlayer(uuid: string): Promise<void> {
    this.players.push(uuid);
    console.log(`Player added: ${uuid}`);

    // Publish NewPlayerApprovedToJoin event
    if (this.channel) {
      const message = {
        event: Events.NewPlayerApprovedToJoin,
        payload: {
          uuid: uuid,
        },
      };
      const buffer = Buffer.from(JSON.stringify(message));
      await this.channel.publish("", "game-events", buffer);
    }
  }
}

export { PlayerService };
