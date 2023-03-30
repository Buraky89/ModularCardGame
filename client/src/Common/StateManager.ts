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

    this.socket.on("gameEvent", (payload: { gameUuid: string; data: any }) => {
      const gameStateManager = this.stateManager.gameStateManagers.get(
        payload.gameUuid
      );
      if (gameStateManager) {
        gameStateManager.updateGameState(payload.data);
      }
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
        const setToken = (token: string) => {
          this.socket.clientMock.emit("loginSuccess", {
            jwtToken: this.stateManager.jwtToken,
          });
        };

        const gameDispatcher = new GameDispatcher();
        gameDispatcher
          .loginGame(loginName, setToken)
          .then(() => {
            console.log("Logged in and joined the game successfully");
          })
          .catch((error) => {
            console.error(
              "Error while logging in and joining the game:",
              error
            );
          });
      } else {
        this.socket.clientMock.emit("loginError");
      }
    }, 1000);

    if (willLoginSuccess) {
      const handleGameListData = (gameList: any) => {
        this.socket.clientMock.emit("gameListCame", {
          gameUuids: gameList,
        });
      };

      const gameDispatcher = new GameDispatcher();
      gameDispatcher.fetchGames(handleGameListData);
    }

    // TODO: reproduce more game events to induce a gameplay
    setTimeout(() => {
      this.socket.clientMock.emit("gameEvent", {
        gameUuid: "a",
        data: {
          // Add your game data here
          deck: [], // example data
          playedDeck: [], // example data
          players: [], // example data
          gameState: 0, // example data
        },
      });
    }, 10000);
  }

  updateGameData(gameUuid: string, cb: (data: any) => void) {
    this.fetchGameData(gameUuid);
  }

  fetchGameData(gameUuid: string) {
    const gameStateManager = this.stateManager.gameStateManagers.get(gameUuid);

    if (!gameStateManager) {
      console.error("Game not found");
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
      .catch((error) => console.log(error));
  }

  selectTheGameUuid(gameUuid: string) {
    this.socket.clientMock.emit("userSubscribedAGameUuid", { gameUuid });
  }
}
