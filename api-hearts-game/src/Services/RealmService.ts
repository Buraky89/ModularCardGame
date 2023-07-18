import { WinstonLogger } from "../Common/WinstonLogger";
import { EventManager } from "./EventManager";
import { GeneralEventManager } from "./GeneralEventManager";
import { HeartsGameService } from "./HeartsGameService";
import { v4 as uuidv4 } from "uuid";
import { IAmqpService } from "../Interfaces/IAmqpService";

class RealmService {
  public generalEventManager?: GeneralEventManager;
  public eventMangers: EventManager[] = [];
  public amqpService: IAmqpService;
  private heartsGameService: HeartsGameService;
  private logger: WinstonLogger;

  constructor(generalEventManager: GeneralEventManager,
    heartsGameService: HeartsGameService,
    logger: WinstonLogger,
    amqpService: IAmqpService,
    eventMangers?: EventManager[]
  ) {
    if (eventMangers) {
      this.eventMangers = eventMangers;
    }
    if (generalEventManager) {
      this.generalEventManager = generalEventManager;
      this.generalEventManager.start();
    }
    this.amqpService = amqpService;
    this.heartsGameService = heartsGameService;
    this.logger = logger;
  }

  async addEventManager(): Promise<EventManager> {
    var eventManagerUuid = uuidv4();

    const eventManager = new EventManager(eventManagerUuid, this.amqpService, this.heartsGameService, this.logger);
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

  public async publishMessageToGameEvents(message: any, gameUuid: string) {
    var eventManager = this.getEventManager(gameUuid);
    return await eventManager.publishMessageToGameEvents(message, gameUuid);
  }

  public async publishMessageToGeneralEvents(message: any) {
    return await this.generalEventManager?.publishMessageToGeneralEvents(message);
  }

  public async stop(): Promise<void> {
    this.amqpService.stop();
  }
}

export { RealmService };
