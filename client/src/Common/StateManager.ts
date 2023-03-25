import { EventEmitter } from "events";
import { SocketServerMock } from "socket.io-mock-ts";

export enum State {
  NotLoggedIn,
  LoginError,
  GameListLoading,
  GameListLoaded,
  WaitingForGame,
  SubscribedToGame,
  ConnectionLostWaiting,
}

export class StateManager {
  state: State;
  gameUuids: string[];
  gameUuid: string;
  userUuid: string;
  jwtToken: string;

  constructor() {
    this.state = State.NotLoggedIn;
    this.gameUuids = [];
    this.gameUuid = "";
    this.userUuid = "";
    this.jwtToken = "";
  }

  setState(newState: State) {
    this.state = newState;
  }

  setJwtToken(jwtToken: string) {
    this.jwtToken = jwtToken;
  }

  setGameUuids(gameUuids: string[]) {
    this.gameUuids = gameUuids;
  }

  setGameUuid(gameUuid: string) {
    this.gameUuid = gameUuid;
  }
}

export class GameClient {
  stateManager: StateManager;
  socket: SocketServerMock;

  constructor() {
    this.stateManager = new StateManager();
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
      "userSelectedTheGameUuid",
      (payload: { gameUuid: string }) => {
        this.stateManager.setState(State.WaitingForGame);
        this.stateManager.setGameUuid(payload.gameUuid);
      }
    );

    this.socket.on("subscribedToGame", () => {
      this.stateManager.setState(State.SubscribedToGame);
    });

    this.socket.on("connectionLost", () => {
      console.log("en azından connectionLost çalıştı");
      this.stateManager.setState(State.ConnectionLostWaiting);
    });
  }

  login(loginName: string) {
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
  }
}
