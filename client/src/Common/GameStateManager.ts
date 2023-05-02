import { Card, Player } from "../Card";
import { GameDispatcher } from "./GameDispatcher";

enum GameState {
  NOT_STARTED,
  STARTED,
  ENDED,
}

class GameStateManager {
  public deck: Card[] = [];
  public playedDeck: Card[] = [];
  public players: Player[] = [];
  public autoPlay: boolean = false;
  public gameState: GameState = GameState.NOT_STARTED;
  public token: string;
  public uuid: string;
  public gameUuid: string;
  private gameDispatcher: GameDispatcher;
  private onStateChange: (() => void) | null;

  constructor(
    uuid: string,
    token: string,
    gameUuid: string,
    onStateChange: (() => void) | null
  ) {
    this.uuid = uuid;
    this.token = token;
    this.gameUuid = gameUuid;
    this.gameDispatcher = new GameDispatcher();
    this.onStateChange = onStateChange;
  }

  public updateGameData(data: any) {
    if (data.deck) this.deck = data.deck;
    if (data.playedDeck) this.playedDeck = data.playedDeck;
    if (data.players) this.players = data.players;
    if (data.gameState !== undefined) this.gameState = data.gameState;
  }

  public async handleCardClick(cardIndex: number) {
    // Mock the HTTP call with the imaginary method playCard
    await this.gameDispatcher.playCard(
      this.token,
      this.uuid,
      this.gameUuid,
      cardIndex
    );
  }

  public async startGame() {
    // Mock the HTTP call with the imaginary method startGame
    await this.gameDispatcher.startGame(this.token, this.uuid, this.gameUuid);
  }

  private setUuid = (uuid: string) => {
    // TODO: is passing the StateManager here a good idea?
    //this.stateManager.userUuid = uuid;
    this.uuid = uuid;
  };

  public async joinGame() {
    await this.gameDispatcher
      .joinGame("aaa", this.gameUuid, this.token, this.setUuid)
      .then(() => {
        // TODO: find a solution to this.log
        //logger.log("GameClient", "Logged in and joined the game successfully");
      })
      .catch((error) => {
        // TODO: find a solution to this.error
        /*logger.error(
          "GameClient",
          "Error while logging in and joining the game:",
          error
        );*/
      });
  }

  public async subscribeGame() {
    await this.gameDispatcher
      .subscribeGame("aaa", this.gameUuid, this.token, this.setUuid)
      .then(() => {
        // TODO: find a solution to this.log
        //logger.log("GameClient", "Logged in and joined the game successfully");
      })
      .catch((error) => {
        // TODO: find a solution to this.error
        /*logger.error(
          "GameClient",
          "Error while logging in and joining the game:",
          error
        );*/
      });
  }

  public setAutoPlay(autoPlay: boolean) {
    this.autoPlay = autoPlay;
    if (this.autoPlay && this.gameState === GameState.STARTED) {
      this.autoPlayInterval();
    }
  }

  private autoPlayInterval() {
    if (this.deck.length > 0) {
      this.handleCardClick(0);
    }
    setTimeout(() => this.autoPlayInterval(), 500);
  }

  updateGameState(data: any) {
    console.log("data obtained in updateGameState: ", data);

    if (data.deck) this.deck = data.deck;
    if (data.playedDeck) this.playedDeck = data.playedDeck;
    if (data.players) this.players = data.players;
    if (data.gameState !== undefined) this.gameState = data.gameState;

    console.log("this.players", this.players);
    console.log("this.gameState", GameState[this.gameState]);

    if (this.onStateChange) this.onStateChange();
  }

  private subscribers: (() => void)[] = [];

  public subscribe(callback: () => void): void {
    this.subscribers.push(callback);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => {
      callback();
    });
  }
}

export default GameStateManager;
