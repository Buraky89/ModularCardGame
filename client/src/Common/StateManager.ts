import { EventEmitter } from "events";
import { SocketServerMock } from "socket.io-mock-ts";
import GameStateManager from "./GameStateManager";

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
  G;
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
      if (this.onStateChange) {
        this.onStateChange();
      }
    }
  }
}

export class GameClient {
  stateManager: StateManager;
  socket: SocketServerMock;

  constructor(onStateChange: () => void) {
    this.stateManager = new StateManager(onStateChange);
    this.socket = new SocketServerMock();
    this.init();
  }

  init() {
    this.socket.on("loginError", () => {
      this.stateManager.setState(State.LoginError);
    });

    this.socket.on("loginSuccess", (payload: { jwtToken: string }) => {
      this.stateManager.setState(State.GameListLoading);
      this.stateManager.setJwtToken(payload.jwtToken);
    });

    this.socket.on("gameListCame", (payload: { gameUuids: string[] }) => {
      this.stateManager.setState(State.GameListLoaded);
      this.stateManager.setGameUuids(payload.gameUuids);
    });

    this.socket.on(
      "userSubscribedAGameUuid",
      (payload: { gameUuid: string }) => {
        this.stateManager.subscribeGameUuid(payload.gameUuid);
      }
    );

    this.socket.on("gameEvent", (payload: { gameUuid: string }) => {
      console.log("game event geldi", payload.gameUuid);
    });

    this.socket.on("subscribedToGame", () => {
      this.stateManager.setState(State.SubscribedToGame);
    });

    this.socket.on("connectionLost", () => {
      console.log("en azından connectionLost çalıştı");
      this.stateManager.setState(State.ConnectionLostWaiting);
    });
  }

  login(loginName: string) {
    this.stateManager.setState(State.LoggingIn);

    this.socket.emit("login", { loginName });

    var willLoginSuccess = Math.random() > 0.5;
    // Mock loginSuccess or loginError event
    setTimeout(() => {
      if (willLoginSuccess) {
        this.socket.clientMock.emit("loginSuccess", {
          jwtToken: "mockJWTToken",
        });
      } else {
        this.socket.clientMock.emit("loginError");
      }
    }, 1000);

    if (willLoginSuccess) {
      // Mock loginSuccess or loginError event
      setTimeout(() => {
        this.socket.clientMock.emit("gameListCame", {
          gameUuids: ["a", "b", "c"],
        });
      }, 1000);
    }

    setTimeout(() => {
      this.socket.clientMock.emit("gameEvent", {
        gameUuid: ["a"],
      });
    }, 10000);
  }

  selectTheGameUuid(gameUuid: string) {
    this.socket.clientMock.emit("userSubscribedAGameUuid", { gameUuid });
  }
}
