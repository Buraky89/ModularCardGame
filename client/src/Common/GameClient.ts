import { SocketServerMock } from "socket.io-mock-ts";
import { GameDispatcher } from "./GameDispatcher";
import { State, StateManager } from "./StateManager";
import { Logger } from "./Logger";
import { StateManagerWrapper } from "./StateManagerWrapper";

export class GameClient {
  stateManager: StateManager;
  socket: SocketServerMock;
  logger: Logger;
  stateManagerVersion: number = 0;

  constructor(onStateChange: () => void) {
    this.logger = new Logger();
    this.stateManager = new StateManager(onStateChange, this.logger);
    this.socket = new SocketServerMock();
    this.init();
  }

  cb(
    logger: Logger,
    stateManager: StateManager,
    gameUuid: string,
    jwtToken: string
  ) {
    const setUuid = (uuid: string) => {
      // TODO: is passing the StateManager here a good idea?
      stateManager.userUuid = uuid;
      const gameStateManager = stateManager.gameStateManagers.get(gameUuid);
      if (gameStateManager !== undefined) gameStateManager.uuid = uuid;
    };
    const gameDispatcher = new GameDispatcher();
    gameDispatcher
      .joinGame("aaa", gameUuid, jwtToken, setUuid)
      .then(() => {
        // TODO: find a solution to this.log
        logger.log("GameClient", "Logged in and joined the game successfully");
      })
      .catch((error) => {
        // TODO: find a solution to this.error
        logger.error(
          "GameClient",
          "Error while logging in and joining the game:",
          error
        );
      });
  }

  init() {
    this.socket.on("loginError", () => {
      this.event("loginError");
      this.stateManager.setState(State.LoginError);
    });

    this.socket.on("loginSuccess", (payload: { jwtToken: string }) => {
      this.event("loginSuccess");
      this.stateManager.setState(State.GameListLoading);
      this.stateManager.setJwtToken(payload.jwtToken);
    });

    this.socket.on("gameListCame", (payload: { gameUuids: string[] }) => {
      this.event("gameListCame");
      this.stateManager.setState(State.GameListLoaded);
      this.stateManager.setGameUuids(payload.gameUuids);
    });

    this.socket.on(
      "userSubscribedAGameUuid",
      (payload: { gameUuid: string }) => {
        this.event("userSubscribedAGameUuid");
        this.stateManager.subscribeGameUuid(payload.gameUuid, this.cb);
      }
    );

    this.socket.on("gameEvent", (payload: { gameUuid: string; data: any }) => {
      this.event("gameEvent");
      const gameStateManager = this.stateManager.gameStateManagers.get(
        payload.gameUuid
      );
      if (gameStateManager) {
        gameStateManager.updateGameState(payload.data);
      }
    });

    this.socket.on("subscribedToGame", () => {
      this.event("subscribedToGame");
      this.stateManager.setState(State.SubscribedToGame);
    });

    this.socket.on("connectionLost", () => {
      this.event("connectionLost");
      this.stateManager.setState(State.ConnectionLostWaiting);
    });
  }

  async login(loginName: string) {
    this.stateManager.setState(State.LoggingIn);

    this.socket.emit("login", { loginName });

    const setToken = (token: string) => {
      this.socket.clientMock.emit("loginSuccess", {
        jwtToken: token,
      });
    };

    const gameDispatcher = new GameDispatcher();
    await gameDispatcher
      .loginGame(loginName, setToken)
      .then(() => {
        this.log("Logged in and joined the game successfully");
      })
      .catch((error) => {
        console.log("error log added ", error);
        this.error("Error while logging in and joining the game:", error);
      });
    const handleGameListData = (gameList: any) => {
      this.socket.clientMock.emit("gameListCame", {
        gameUuids: gameList,
      });
    };

    gameDispatcher.fetchGames(handleGameListData);
  }

  updateGameData(gameUuid: string, cb: (data: any) => void) {
    this.fetchGameData(gameUuid);
  }

  fetchGameData(gameUuid: string) {
    const gameStateManager = this.stateManager.gameStateManagers.get(gameUuid);

    if (!gameStateManager) {
      this.error("Game not found");
      return;
    }

    const uuid = gameStateManager.uuid;
    console.log("pekibu", uuid);
    const token = gameStateManager.token;

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    fetch(`http://localhost:3001/players/${gameUuid}/${uuid}`, { headers })
      .then((response) => response.json())
      .then((data) => {
        this.socket.clientMock.emit("gameEvent", {
          gameUuid: gameUuid,
          data,
        });
      })
      .catch((error) => this.log(error));
  }

  public async createGame() {
    const gameDispatcher = new GameDispatcher();
    await gameDispatcher.createGame(this.stateManager.jwtToken);
  }

  public getStateManager(): StateManagerWrapper {
    this.stateManagerVersion++;
    return new StateManagerWrapper(this.stateManager, this.stateManagerVersion);
  }

  selectTheGameUuid(gameUuid: string) {
    this.socket.clientMock.emit("userSubscribedAGameUuid", { gameUuid });
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
