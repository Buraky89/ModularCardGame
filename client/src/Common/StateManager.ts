import { EventEmitter } from "events";
import { SocketServerMock } from "socket.io-mock-ts";
import GameStateManager from "./GameStateManager";
import { Logger } from "./Logger";

export enum State {
  NotLoggedIn,
  LoggingIn, // Add the new state here
  LoginError,
  GameListLoading,
  GameListLoaded,
  SubscribedToGame,
  ConnectionLostWaiting,
}

export class StateManager {
  state: State;
  gameUuids: string[];
  subscribedGameUuids: string[];
  userUuid: string;
  jwtToken: string;
  private onStateChange: (() => void) | null;
  gameStateManagers: Map<string, GameStateManager>; // Add a list of GameStateManager instances
  logger: Logger;

  constructor(onStateChange: () => void, logger: Logger) {
    this.state = State.NotLoggedIn;
    this.gameUuids = [];
    this.subscribedGameUuids = [];
    this.userUuid = "";
    this.jwtToken = "";
    this.onStateChange = onStateChange;
    this.gameStateManagers = new Map(); // Initialize the list of GameStateManager instances
    this.logger = logger;
  }

  createGameStateManager(gameUuid: string) {
    // Create a new instance of GameStateManager and store it in the list
    const gameStateManager = new GameStateManager(
      this.userUuid,
      this.jwtToken,
      gameUuid
    );
    this.gameStateManagers.set(gameUuid, gameStateManager);
  }

  setState(newState: State) {
    this.state = newState;
    if (this.onStateChange) {
      this.log("Set the state to ", State[newState]);
      this.onStateChange();
    }
  }

  setJwtToken(jwtToken: string) {
    this.jwtToken = jwtToken;
    if (this.onStateChange) {
      this.onStateChange();
    }
  }

  setGameUuids(gameUuids: string[]) {
    this.gameUuids = gameUuids;
    if (this.onStateChange) {
      this.onStateChange();
    }
  }

  subscribeGameUuid(
    gameUuid: string,
    cb: (
      logger: Logger,
      stateManager: StateManager,
      gameUuid: string,
      jwtToken: string
    ) => void
  ) {
    if (!this.subscribedGameUuids.includes(gameUuid)) {
      this.subscribedGameUuids.push(gameUuid);
      cb(this.logger, this, gameUuid, this.jwtToken);

      this.createGameStateManager(gameUuid);
      if (this.onStateChange) {
        this.onStateChange();
      }
    }
  }

  log(...messages: any[]) {
    this.logger.log(this.constructor.name, messages);
  }
  event(...messages: any[]) {
    this.logger.event(this.constructor.name, messages);
  }
  error(...messages: any[]) {
    this.logger.error(this.constructor.name, messages);
  }
}
