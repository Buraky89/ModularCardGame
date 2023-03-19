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

  addEventManager(): EventManager {
    const eventManager = new EventManager();
    this.eventMangers.push(eventManager);
    return eventManager;
  }

  getEventManagers(): EventManager[] {
    return this.eventMangers;
  }

  getFirstEventManager(): EventManager {
    // TODO: fix this and take a uuid from the args
    console.log("first event maanger", this.eventMangers[0]);
    return this.eventMangers[0];
  }

  async start(): Promise<void> {
    await this.getFirstEventManager().start();
  }

  async getGameData(uuid: string): Promise<any> {
    return this.getFirstEventManager().gameService.getGameData(uuid);
  }

  public isGameEnded(): boolean {
    return this.getFirstEventManager().gameService.gameState == GameState.ENDED;
  }

  async stop(): Promise<void> {
    await this.getFirstEventManager().amqpService.stop();
  }

  async restartGame(): Promise<any> {
    await this.getFirstEventManager().restartGame();
  }
}

export { RealmService };
