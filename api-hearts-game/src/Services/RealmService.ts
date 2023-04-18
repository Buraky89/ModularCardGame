import { EventManager } from "./EventManager";

enum GameState {
  NOT_STARTED,
  STARTED,
  ENDED,
}

class RealmService {
  private eventMangers: EventManager[] = [];

  constructor(eventMangers?: EventManager[]) {
    if (eventMangers) {
      this.eventMangers = eventMangers;
    }
  }

  async addEventManager(uuid: string): Promise<EventManager> {
    const eventManager = new EventManager(uuid);
    this.eventMangers.push(eventManager);

    await this.getEventManager(eventManager.uuid).start();

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
    return this.getEventManager(uuid).gameService.gameState == GameState.ENDED;
  }

  async stop(uuid: string): Promise<void> {
    await this.getEventManager(uuid).amqpService.stop();
  }

  async restartGame(uuid: string): Promise<any> {
    await this.getEventManager(uuid).restartGame();
  }
}

export { RealmService };
