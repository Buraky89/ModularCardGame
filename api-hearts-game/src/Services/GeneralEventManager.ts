import { AmqpService } from "./AmqpService";
import Events from "../Common/Events";
import {
  NewPlayerWantsToJoinPayload,
  GeneralUpdateMessagePayload,
} from "../Common/Payloads";

class GeneralEventManager {
  public amqpService: AmqpService;
  public uuidList: string[]; // List to store the UUIDs

  constructor() {
    this.amqpService = new AmqpService();
    this.uuidList = []; // Initialize the UUID list
  }

  async start(): Promise<void> {
    const channel = await this.amqpService.start("general");

    await this.amqpService.start("general-exchange");

    // await channel.consume(
    //   `game-events-general`,
    //   this.handleMessage.bind(this),
    //   {
    //     noAck: true,
    //   }
    // );
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
      case Events.GeneralUpdateMessage:
        this.handleGeneralUpdateMessage(
          payload as GeneralUpdateMessagePayload
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

    this.uuidList.push(uuid); // Add the UUID to the list
    console.log("Updated UUID list:", this.uuidList);
  }

  private handleGeneralUpdateMessage(
    payload: GeneralUpdateMessagePayload
  ): void {
    const { gameUuidList } = payload;
    console.log("General update message", payload);

    // Distribute a message for each UUID in the list
    this.uuidList.forEach((viewerUuid) => {
      gameUuidList.forEach((uuid) => {
        const message = {
          event: Events.GeneralUpdateMessageExchange,
          payload: {
            gameUuidList,
            viewerUuid
          },
        };

        const buffer = Buffer.from(JSON.stringify(message));
        // Distribute the message using the UUID as the routing key
        this.amqpService.publish("", `game-events-general-exchange`, buffer);
      });
    });
  }
}

export { GeneralEventManager };
