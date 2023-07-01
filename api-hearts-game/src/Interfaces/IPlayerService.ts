import { Player } from "../Common/Player";
import { CardService } from "../Services/CardService";
import { Mutex } from "async-mutex";

interface IPlayerService {
    players: Player[];
    viewers: Player[];
    cardService: CardService;
    turnMutex: Mutex;
    callback: ((message: any) => void) | undefined;

    restartAsClean(): void;

    start(callback: (message: any) => void): Promise<void>;

    addPlayer(
        playerName: string,
        uuid: string,
        eventManagerUuid: string
    ): Promise<void>;

    subscribeViewer(
        playerName: string,
        uuid: string,
        eventManagerUuid: string
    ): Promise<void>;

    distributeCards(eventManagerUuid: string): Promise<void>;

    publishCardsAreDistributedEvent(eventManagerUuid: string): Promise<void>;

    onCardsAreDistributed(): void;

    haveAnyPlayersCards(): boolean;

    setWhoseTurn(): void;

    getWinner(): Player | null;
}

export { IPlayerService };
