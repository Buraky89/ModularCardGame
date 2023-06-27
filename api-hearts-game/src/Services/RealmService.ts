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
    this.generalEventManager?.publishGeneralUpdateMessage(eventManagerUuids);

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

  async getGameData(eventManagerUuid: string, uuid: string): Promise<any> {
    return this.getEventManager(eventManagerUuid).gameService.getGameData(uuid);
  }

  public isGameEnded(uuid: string): boolean {
    return this.getEventManager(uuid).gameService.isGameEnded();
  }

  async restartGame(uuid: string): Promise<any> {
    await this.getEventManager(uuid).restartGame();
  }

  async start(): Promise<any> {

  }
}

export { RealmService };
