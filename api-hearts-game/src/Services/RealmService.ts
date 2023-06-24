import Events from "../Common/Events";
import { WinstonLogger } from "../Common/WinstonLogger";
import { AmqpService } from "./AmqpService";
import { EventManager } from "./EventManager";
import { GeneralEventManager } from "./GeneralEventManager";
import { HeartsGameService } from "./HeartsGameService";

class RealmService {
  public generalEventManager?: GeneralEventManager;
  public eventMangers: EventManager[] = [];

  constructor(generalEventManager: GeneralEventManager, eventMangers?: EventManager[]) {
    if (eventMangers) {
      this.eventMangers = eventMangers;
    }
    if (generalEventManager) {
      this.generalEventManager = generalEventManager;
      this.generalEventManager.start();
    }
  }

  async addEventManager(uuid: string): Promise<EventManager> {
    const logger = new WinstonLogger();
    const amqpService = new AmqpService();
    const heartsGameService = new HeartsGameService();
    const eventManager = new EventManager(uuid, amqpService, heartsGameService, logger);
    this.eventMangers.push(eventManager);

    await this.getEventManager(eventManager.uuid).start();

    const eventManagerUuids: string[] = [];
    this.eventMangers.forEach((em: EventManager) => {
      eventManagerUuids.push(em.uuid);
    })
    if (this.generalEventManager) {

      const message = {
        event: Events.GeneralUpdateMessage,
        payload: {
          gameUuidList: eventManagerUuids
        },
      };
      const buffer = Buffer.from(JSON.stringify(message));

      try {
        await this.generalEventManager.amqpService.publish("", `game-events-general`, buffer);
      } catch (err) {
        console.error("Error publishing message", err);
      }


    }


    return eventManager;
  }

  getEventManagers(): EventManager[] {
    return this.eventMangers;
  }

  getEventManager(uuid: string): EventManager {
    const eventManager = this.eventMangers.find(
      (eventManager) => eventManager.uuid === uuid
    );
    if (!eventManager) {
      throw new Error(`EventManager with uuid ${uuid} not found.`);
    }
    return eventManager;
  }

  async start(): Promise<void> {
    //await this.getEventManager(uuid).start();
  }

  async getGameData(eventManagerUuid: string, uuid: string): Promise<any> {
    return this.getEventManager(eventManagerUuid).gameService.getGameData(uuid);
  }

  public isGameEnded(uuid: string): boolean {
    return this.getEventManager(uuid).gameService.isGameEnded();
  }

  async stop(uuid: string): Promise<void> {
    await this.getEventManager(uuid).amqpService.stop();
  }

  async restartGame(uuid: string): Promise<any> {
    await this.getEventManager(uuid).restartGame();
  }
}

export { RealmService };
