import { SocketServerMock } from "socket.io-mock-ts";
import { GameDispatcher } from "./GameDispatcher";
import { State, StateManager } from "./StateManager";
import { Logger } from "./Logger";
import { StateManagerWrapper } from "./StateManagerWrapper";
import { io, Socket } from "socket.io-client";
import GameStateManager from "./GameStateManager";

export class GameClient {
  stateManager: StateManager;
  socket: SocketServerMock;
  realSocket: Socket | undefined;
  logger: Logger;
  stateManagerVersion: number = 0;
  customToken: string | undefined;
  private onMessage: ((message: string) => void);

  constructor(onStateChange: () => void, onMessage: (message: string) => void, customToken?: string) {
    this.logger = new Logger();
    this.stateManager = new StateManager(onStateChange, this.logger);
    this.customToken = customToken;
    this.socket = new SocketServerMock();
    this.onMessage = onMessage;
    this.init();
  }

  afterInit() {
    this.retainLogin();
    this.realSocket = io("http://localhost:3001");

    // real socket events
    this.realSocket?.on("connect", () => {
      console.log("Connected!");
    });

    this.realSocket?.on("gameEvent", (data) => {
      console.log("Received game event:", data);
      if (this.socket instanceof SocketServerMock) {
        this.socket.clientMock.emit("gameEvent", data.payload);
      }
    });

    this.realSocket?.on("generalEvent", (data) => {
      console.log("Received general event:", data);
      if (this.socket instanceof SocketServerMock) {
        this.socket.clientMock.emit("generalEvent", data.payload);
      }
    });

    this.realSocket?.on("disconnect", () => {
      console.log("Disconnected");
    });

    this.realSocket?.on("error", (err) => {
      console.error("Socket error:", err);
    });
  }

  async retainLogin() {
    const savedJwtToken = this.getSavedToken();
    if (savedJwtToken) {
      this.stateManager.setJwtToken(savedJwtToken);
      this.stateManager.setState(State.GameListLoading);

      const gameDispatcher = new GameDispatcher();
      const handleGameListData = (gameList: any) => {
        this.socket.clientMock.emit("gameListCame", {
          gameUuids: gameList,
        });
      };

      gameDispatcher.fetchGames(handleGameListData, savedJwtToken);

      await gameDispatcher.subscribeGeneral(savedJwtToken);
    }
  }

  getSavedToken() {
    return this.customToken ?? this.getTokenFromLocalStorage();
  }

  getTokenFromLocalStorage(): string | null {
    return localStorage.getItem("jwtToken");
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
      .subscribeGame("aaa", gameUuid, jwtToken, setUuid)
      .then(() => {
        // TODO: find a solution to this.log
        logger.log(
          "GameClient",
          "Logged in and subscribed the game successfully"
        );
      })
      .catch((error) => {
        // TODO: find a solution to this.error
        logger.error(
          "GameClient",
          "Error while logging in and subscribing the game:",
          error
        );
      });
  }

  init() {
    // fake socket events
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

    this.socket.on("gameEvent", (payload: { gameUuid: string; data: any, message: string | null }) => {
      this.event("gameEvent");
      const gameStateManager = this.stateManager.gameStateManagers.get(
        payload.gameUuid
      );
      console.log("payload", payload);
      if (payload.message) {
        this.onMessage(payload.message);
      }
      if (gameStateManager) {
        gameStateManager.updateGameState(payload.data);
      }
    });

    this.socket.on("generalEvent", (payload: any) => {
      this.event("generalEvent");
      console.log("general event payload", payload);

      this.stateManager.setGameUuids((payload.gameUuidList));
    });

    this.socket.on("subscribedToGame", () => {
      this.event("subscribedToGame");
      this.stateManager.setState(State.SubscribedToGame);
    });

    this.socket.on("connectionLost", () => {
      this.event("connectionLost");
      this.stateManager.setState(State.ConnectionLostWaiting);
    });

    this.socket.on("logout", () => {
      this.event("logout");
      this.stateManager.setState(State.NotLoggedIn);
      this.stateManager.setJwtToken("");
    });
  }

  public exchangeCodeForToken(authorizationCode: string) {
    this.stateManager.setState(State.EXCHANGING_CODE_FOR_TOKEN);

    setTimeout(async () => {
      // Code to exchange authorization code for access token
      // ...
      try {
        const accessToken = await this.stateManager.getTokenByAuthorizationCode(
          authorizationCode
        );
        if (accessToken) {
          this.stateManager.setJwtToken(accessToken);

          this.socket.clientMock.emit("loginSuccess", {
            jwtToken: accessToken,
          });

          const gameDispatcher = new GameDispatcher();
          const handleGameListData = (gameList: any) => {
            this.socket.clientMock.emit("gameListCame", {
              gameUuids: gameList,
            });
          };

          gameDispatcher.fetchGames(handleGameListData, accessToken);

          await gameDispatcher.subscribeGeneral(accessToken);
          // Code to store the access token and redirect to the main application view
          // ...
        } else {
          this.stateManager.setState(State.TOKEN_RETRIEVAL_FAILED);
          // Code to display an error message and allow the user to retry the token retrieval process
          // ...
        }
      } catch (error) {
        this.error(error);
        this.stateManager.setState(State.TOKEN_RETRIEVAL_FAILED);
      }
    }, 5000);
  }

  async login() {
    this.stateManager.setState(State.LoggingIn);

    window.location.href =
      "http://localhost:8080/realms/FlexibleCardGame/protocol/openid-connect/auth?response_type=code&client_id=flexible-card-game";
  }
  async logout() {
    this.socket.clientMock.emit("logout");
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

    const handleGameListData = (gameList: any) => {
      this.socket.clientMock.emit("gameListCame", {
        gameUuids: gameList,
      });
    };

    gameDispatcher.fetchGames(handleGameListData, this.stateManager.jwtToken);
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
