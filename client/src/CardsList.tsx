import { useEffect, useState, useRef } from "react";
import { Card, CardType, ApiResponse, Player } from "./Card";
import MySVG from "./MySVG";
import { PlayerBox } from "./PlayerBox";
import "./CardsList.css";
import { GameClient } from './Common/GameClient';

interface CardsListProps {
  client: GameClient;
  gameUuid: string;
}

function moveLastPlayerToBeginningUntilMe(players: Player[], myUuid: string): Player[] {
  const index = players.findIndex(player => player.uuid === myUuid);
  if (index === -1) {
    // myUuid is not among the players
    return players;
  }
  players.sort((a, b) => a.uuid.localeCompare(b.uuid));
  while (players[players.length - 1].uuid !== myUuid) {
    const lastPlayer = players.pop()!;
    players.unshift(lastPlayer);
  }
  return players;
}

enum GameState {
  NOT_STARTED,
  STARTED,
  ENDED,
}

function CardsList({ client, gameUuid }: CardsListProps) {
  const gameStateManager = client.stateManager.gameStateManagers.get(gameUuid)!;

  const [gameState, setGameState] = useState({
    deck: client.stateManager.gameStateManagers.get(gameUuid)!.deck,
    playedDeck: client.stateManager.gameStateManagers.get(gameUuid)!.playedDeck,
    players: client.stateManager.gameStateManagers.get(gameUuid)!.players,
    autoPlay: client.stateManager.gameStateManagers.get(gameUuid)!.autoPlay,
    gameState: client.stateManager.gameStateManagers.get(gameUuid)!.gameState,
    uuid: client.stateManager.gameStateManagers.get(gameUuid)!.uuid,
  });

  useEffect(() => {
    const unsubscribe = client.stateManager.gameStateManagers.get(gameUuid)!.subscribe(() => {
      setGameState({
        deck: client.stateManager.gameStateManagers.get(gameUuid)!.deck,
        playedDeck: client.stateManager.gameStateManagers.get(gameUuid)!.playedDeck,
        players: client.stateManager.gameStateManagers.get(gameUuid)!.players,
        autoPlay: client.stateManager.gameStateManagers.get(gameUuid)!.autoPlay,
        gameState: client.stateManager.gameStateManagers.get(gameUuid)!.gameState,
        uuid: client.stateManager.gameStateManagers.get(gameUuid)!.uuid,
      });
    });

    return unsubscribe;
  }, [client.stateManager, gameUuid]);

  const timerIdRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (gameState.autoPlay && gameState.gameState === GameState.STARTED) {
      timerIdRef.current = setInterval(() => {
        if (gameState.deck.length > 0) {
          gameStateManager.handleCardClick(0);
        }
      }, 500);
    } else {
      clearInterval(timerIdRef.current!);
    }

    return () => clearInterval(timerIdRef.current!);
  }, [gameState.autoPlay, gameState.deck]);

  const isYourTurn = gameState.players.find((player) => player.uuid === gameState.uuid && player.isTheirTurn);

  const startGame = () => {
    gameStateManager.startGame();
  };

  return (
    <div className="cards-list">
      GAMEUUID: {gameUuid}
      {gameState.gameState === GameState.NOT_STARTED && (
        <div className="not-started">
          <h1>Game is not started yet</h1>
          <button onClick={startGame}>Start</button>
        </div>
      )}
      {gameState.gameState !== GameState.NOT_STARTED && (
        <>
          <div className="player-row">
            <PlayerBox player={gameState.players[1]} isActive={gameState.players[1]?.isTheirTurn} />
          </div>
          <div className="main-row">
            <PlayerBox player={gameState.players[0]} isActive={gameState.players[0]?.isTheirTurn} />
            <div className="played-cards-container">
              {gameState.playedDeck.length > 0 &&
                gameState.playedDeck.map((card: Card, index: number) => (
                  <div
                    style={{
                      position: "absolute",
                      top: "40%",
                      left: "40%",
                      zIndex: 1000 + index - gameState.playedDeck.length - index,
                      transform: `rotate(${index * 30}deg)`,
                    }}
                  >
                    <MySVG
                      key={`played-card-${index}`}
                      cardType={card.cardType}
                      score={card.score}
                      hidden={card.hidden}
                      handleClick={() => {}}
                    />
                  </div>
                ))}
              <div className="center-card"></div>
            </div>
            <PlayerBox player={gameState.players[2]} isActive={gameState.players[2]?.isTheirTurn} />
          </div>
          <div className="player-row">
            <PlayerBox player={gameState.players[3]} isActive={gameState.players[3]?.isTheirTurn} />
          </div>
          <div className="deck-row">
            {gameState.deck.map((card: Card, index: number) => (
              <div key={`card-${index}`} className="deck-card" onClick={() => gameStateManager.handleCardClick(index)}>
                <MySVG
                  cardType={card.cardType}
                  score={card.score}
                  hidden={card.hidden}
                  handleClick={() => gameStateManager.handleCardClick(index)}
                />
              </div>
            ))}
          </div>
          <div className="auto-play-row">
            <label>
              <input
                type="checkbox"
                checked={gameState.autoPlay}
                onChange={() => gameStateManager.setAutoPlay(!gameState.autoPlay)}
              />
              Auto Play
            </label>
          </div>
        </>
      )}
      {gameState.gameState === GameState.ENDED && (
        <div className="overlay">
          <div className="game-ended">
            <h1>Game ended</h1>
            <p>Final scores:</p>
            {gameState.players.map((player: Player, index: number) => (
              <div key={player.uuid}>
                {player.name}: {player.points}
              </div>
            ))}
            <button onClick={startGame}>Start Again</button>
          </div>
        </div>
      )}
    </div>
  );  
}

export default CardsList;
