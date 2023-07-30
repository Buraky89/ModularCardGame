import { Player } from "../Common/Player";

export interface IGameService {
    distributeCards(uuid: string): Promise<void>;
    startPlayerService(callback: (message: any) => void): Promise<void>;
    isGameEnded(): boolean;
    getGameData(playerUuid: string): Promise<any>;
    GetPlayerUuidsToExchange(playerUuid: string): Player[];
    endGame(): void;
    startGame(): void;
    isPlayersStillNotMax(): Promise<boolean>;
    addPlayer(playerName: string, uuid: string, gameUuid: string): void;
    subscribeViewer(playerName: string, uuid: string, gameUuid: string): void;
    findPlayer(uuid: string): Promise<Player | undefined>;
    turnMutex(): Promise<() => void>;
    playGame(player: Player, selectedIndex: number, gameUuid: string): Promise<any>;
    setWhoseTurn(): Promise<void>;
    isThisAValidCardToPlay(player: Player, selectedIndex: number, outputEvent: { message: string }): boolean;
    isGameNotStarted(): boolean;
    isGameStarted(): boolean;
    restartAsClean(): void;
    onCardsAreDistributed(): Promise<void>;
}
