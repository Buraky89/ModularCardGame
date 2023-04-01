import { SocketServerMock } from "socket.io-mock-ts";
import { GameDispatcher } from "./GameDispatcher";
import { State, StateManager } from "./StateManager";
import { Logger } from "./Logger";

export class GameClient {
  stateManager: StateManager;
  socket: SocketServerMock;
  logger: Logger;

  constructor(onStateChange: () => void) {
    this.stateManager = new StateManager(onStateChange);
    this.socket = new SocketServerMock();
    this.logger = new Logger();
    this.init();
  }

  cb(gameUuid: string, jwtToken: string) {
    const setUuid = (uuid: string) => {
      this.stateManager.userUuid = uuid;
      const gameStateManager =
        this.stateManager.gameStateManagers.get(gameUuid);
      if (gameStateManager !== undefined) gameStateManager.uuid = uuid;
    };
    const gameDispatcher = new GameDispatcher();
    gameDispatcher
      .joinGame("aaa", gameUuid, jwtToken, setUuid)
      .then(() => {
        this.logger.log("Logged in and joined the game successfully");
      })
      .catch((error) => {
        this.logger.error(
          "Error while logging in and joining the game:",
          error
        );
      });
  }

  init() {
    this.socket.on("loginError", () => {
      this.logger.event("loginError");
      this.stateManager.setState(State.LoginError);
    });

    this.socket.on("loginSuccess", (payload: { jwtToken: string }) => {
      this.logger.event("loginSuccess");
      this.stateManager.setState(State.GameListLoading);
      this.stateManager.setJwtToken(payload.jwtToken);
    });

    this.socket.on("gameListCame", (payload: { gameUuids: string[] }) => {
      this.logger.event("gameListCame");
      this.stateManager.setState(State.GameListLoaded);
      this.stateManager.setGameUuids(payload.gameUuids);
    });

    this.socket.on(
      "userSubscribedAGameUuid",
      (payload: { gameUuid: string }) => {
        this.logger.event("userSubscribedAGameUuid");
        this.stateManager.subscribeGameUuid(payload.gameUuid, this.cb);
      }
    );

    this.socket.on("gameEvent", (payload: { gameUuid: string; data: any }) => {
      this.logger.event("gameEvent");
      const gameStateManager = this.stateManager.gameStateManagers.get(
        payload.gameUuid
      );
      if (gameStateManager) {
        gameStateManager.updateGameState(payload.data);
      }
    });

    this.socket.on("subscribedToGame", () => {
      this.logger.event("subscribedToGame");
      this.stateManager.setState(State.SubscribedToGame);
    });

    this.socket.on("connectionLost", () => {
      this.logger.event("connectionLost");
      this.stateManager.setState(State.ConnectionLostWaiting);
    });
  }

  async login(loginName: string) {
    this.stateManager.setState(State.LoggingIn);

    this.socket.emit("login", { loginName });

    const setToken = (token: string) => {
      this.socket.clientMock.emit("loginSuccess", {
        jwtToken: this.stateManager.jwtToken,
      });
    };

    const gameDispatcher = new GameDispatcher();
    await gameDispatcher
      .loginGame(loginName, setToken)
      .then(() => {
        this.logger.log("Logged in and joined the game successfully");
      })
      .catch((error) => {
        this.logger.error(
          "Error while logging in and joining the game:",
          error
        );
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
      this.logger.error("Game not found");
      return;
    }

    const uuid = gameStateManager.uuid;
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
      .catch((error) => this.logger.log(error));
  }

  selectTheGameUuid(gameUuid: string) {
    this.socket.clientMock.emit("userSubscribedAGameUuid", { gameUuid });
  }
}
