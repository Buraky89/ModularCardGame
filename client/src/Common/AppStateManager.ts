import { LoginResponse, JoinResponse, ErrorResponse } from "./ResponseTypes";

export class AppStateManager {
  private state:
    | "notLoggedIn"
    | "loginError"
    | "connectingToGames"
    | "inGame"
    | "connectionLostWaiting";
  private gameUuid: string;
  private readonly eventSource: EventSource; // this will be replaced with socket.io later

  constructor() {
    this.state = "notLoggedIn";
    this.gameUuid = "";
    this.eventSource = new EventSource("/events"); // replace with your own endpoint
    this.eventSource.addEventListener(
      "loginSuccess",
      this.handleLoginSuccess.bind(this)
    );
    this.eventSource.addEventListener(
      "loginError",
      this.handleLoginError.bind(this)
    );
    this.eventSource.addEventListener(
      "connectingToGames",
      this.handleConnectingToGames.bind(this)
    );
    this.eventSource.addEventListener(
      "gameJoined",
      this.handleGameJoined.bind(this)
    );
    this.eventSource.addEventListener(
      "connectionLost",
      this.handleConnectionLost.bind(this)
    );
  }

  public handleLoginSuccess(event: MessageEvent<LoginResponse>) {
    console.log("Logged in successfully");
    this.state = "connectingToGames";
  }

  public handleLoginError(event: MessageEvent<ErrorResponse>) {
    console.error(event.data);
    this.state = "loginError";
  }

  public handleConnectingToGames() {
    console.log("Connecting to games...");
    this.state = "connectingToGames";
  }

  public handleGameJoined(event: MessageEvent<JoinResponse>) {
    console.log(event.data.message);
    this.gameUuid = event.data.uuid;
    this.state = "inGame";
  }

  public handleConnectionLost() {
    console.log("Connection lost. Waiting...");
    this.state = "connectionLostWaiting";
  }

  public getState() {
    return {
      state: this.state,
      gameUuid: this.gameUuid,
    };
  }

  public selectGame(gameUuid: string) {
    // send a message to the server to join the game
    // and wait for the 'gameJoined' event
    this.state = "connectingToGames";
    this.gameUuid = gameUuid;
    // send a message to the server to join the game with this.gameUuid
    // and token obtained from handleLoginSuccess
    // after receiving the response, call handleGameJoined with the response
  }

  public disconnect() {
    // send a message to the server to disconnect from the game
    // and wait for the 'disconnected' event
    this.state = "notLoggedIn";
    this.gameUuid = "";
    // send a message to the server to disconnect the current game
    // after receiving the response, call handleDisconnected
  }
}
