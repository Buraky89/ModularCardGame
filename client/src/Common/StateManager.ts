import { EventEmitter } from "events";
import { SocketServerMock } from "socket.io-mock-ts";
import GameStateManager from "./GameStateManager";
import { GameDispatcher } from "./GameDispatcher";

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

  constructor(onStateChange: () => void) {
    this.state = State.NotLoggedIn;
    this.gameUuids = [];
    this.subscribedGameUuids = [];
    this.userUuid = "";
    this.jwtToken = "";
    this.onStateChange = onStateChange;
    this.gameStateManagers = new Map(); // Initialize the list of GameStateManager instances
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

  subscribeGameUuid(gameUuid: string) {
    if (!this.subscribedGameUuids.includes(gameUuid)) {
      this.subscribedGameUuids.push(gameUuid);

      // TODO:
      const setUuid = (uuid: string) => {
        this.userUuid = uuid;
        const gameStateManager = this.gameStateManagers.get(gameUuid);
        if (gameStateManager !== undefined) gameStateManager.uuid = uuid;
      };
      const gameDispatcher = new GameDispatcher();
      gameDispatcher
        .joinGame("aaa", gameUuid, this.jwtToken, setUuid)
        .then(() => {
          console.log("Logged in and joined the game successfully");
        })
        .catch((error) => {
          console.error("Error while logging in and joining the game:", error);
        });

      this.createGameStateManager(gameUuid);
      if (this.onStateChange) {
        this.onStateChange();
      }
    }
  }
}
