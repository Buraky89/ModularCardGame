import { AmqpService } from "./AmqpService";
import Events from "../Common/Events";
import {
  NewPlayerWantsToJoinPayload,
} from "../Common/Payloads";

class GeneralEventManager {
  public amqpService: AmqpService;

  constructor() {
    this.amqpService = new AmqpService();
  }

  async start(): Promise<void> {
    const channel = await this.amqpService.start("general");

    await channel.consume(
      `game-events-general`,
      this.handleMessage.bind(this),
      {
        noAck: true,
      }
    );
  }

  async stop(): Promise<void> {
    await this.amqpService.stop();
  }

  async handleMessage(msg: any): Promise<void> {
    const message = JSON.parse(msg.content.toString());
    console.log(`Received message: ${JSON.stringify(message)}`);
    await this.handleEvent(message);
  }

  async handleEvent(message: any): Promise<void> {
    const { event, payload } = message;

    switch (event) {
      case Events.NewViewerWantsToSubscribeGeneral:
        this.handleNewViewerWantsToSubscribeGeneral(
          payload as NewPlayerWantsToJoinPayload
        );
        break;
      default:
        throw new Error(`Invalid event: ${event}`);
    }
  }

  private handleNewViewerWantsToSubscribeGeneral(
    payload: NewPlayerWantsToJoinPayload
  ): void {
    const { date, ip, uuid, playerName } = payload;
    console.log("New payload wants to subscribe to general", payload);
  }
}

export { GeneralEventManager };
