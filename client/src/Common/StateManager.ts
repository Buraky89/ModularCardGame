import { EventEmitter } from "events";
import { SocketServerMock } from "socket.io-mock-ts";
import GameStateManager from "./GameStateManager";
import { Logger } from "./Logger";

export enum State {
  NotLoggedIn,
  LoggingIn, // Add the new state here
  EXCHANGING_CODE_FOR_TOKEN,
  TOKEN_RECEIVED,
  TOKEN_RETRIEVAL_FAILED,
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
  gameStateManagersToString: string;
  logger: Logger;

  constructor(onStateChange: () => void, logger: Logger) {
    this.state = State.NotLoggedIn;
    this.gameUuids = [];
    this.subscribedGameUuids = [];
    this.userUuid = "";
    this.jwtToken = "";
    this.onStateChange = onStateChange;
    this.gameStateManagers = new Map(); // Initialize the list of GameStateManager instances
    const serializedGameStateManagers = JSON.stringify(
      Array.from(this.gameStateManagers.entries())
    );
    this.gameStateManagersToString = serializedGameStateManagers;
    this.logger = logger;

    const savedJwtToken = this.getTokenFromLocalStorage();
    if (savedJwtToken) {
      // TODO: fix this. React calls our objects in a way that we do not suppose. find it and address a solution.
      //this.setJwtToken(savedJwtToken);
      //this.setState(State.GameListLoading);
    }
  }

  saveTokenToLocalStorage(jwtToken: string) {
    localStorage.setItem("jwtToken", jwtToken);
  }

  getTokenFromLocalStorage(): string | null {
    return localStorage.getItem("jwtToken");
  }

  async getTokenByAuthorizationCode(
    authorizationCode: string
  ): Promise<string> {
    const path =
      "http://localhost:8080/realms/FlexibleCardGame/protocol/openid-connect/token";

    const formData = new URLSearchParams();
    formData.append("client_id", "flexible-card-game");
    formData.append("client_secret", "8lL55Se6FeiOLwFVKr9aMmYzy9e9O3Ds");
    formData.append("code", authorizationCode);
    formData.append("grant_type", "authorization_code");

    try {
      const response = await fetch(path, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (!response.ok) {
        throw new Error("Token request failed");
      }

      const result = await response.json();

      if (!result.access_token) {
        throw new Error("Access token not found in response");
      }

      return result.access_token;
    } catch (error) {
      throw new Error("Access token could not be fetched");
    }
  }

  createGameStateManager(gameUuid: string) {
    // Create a new instance of GameStateManager and store it in the list
    const gameStateManager = new GameStateManager(
      this.userUuid,
      this.jwtToken,
      gameUuid,
      this.onStateChange
    );
    this.gameStateManagers.set(gameUuid, gameStateManager);

    const serializedGameStateManagers = JSON.stringify(
      Array.from(this.gameStateManagers.entries())
    );
    this.gameStateManagersToString = serializedGameStateManagers;
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
    this.saveTokenToLocalStorage(jwtToken);
    if (this.jwtToken !== "") this.setState(State.TOKEN_RECEIVED);
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
