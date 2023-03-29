import { useEffect, useState, useRef } from "react";
import { Card, CardType, ApiResponse, Player } from "./Card";
import MySVG from "./MySVG";
import { PlayerBox } from "./PlayerBox";
import "./CardsList.css";
import GameStateManager from "./Common/GameStateManager";

interface CardsListProps {
  token: string;
  uuid: string;
  gameUuid: string;
  gameStateManager: GameStateManager;
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

function CardsList({ uuid, token, gameUuid, gameStateManager }: CardsListProps) {
  const timerIdRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (gameStateManager.autoPlay && gameStateManager.gameState === GameState.STARTED) {
      timerIdRef.current = setInterval(() => {
        if (gameStateManager.deck.length > 0) {
          gameStateManager.handleCardClick(0);
        }
      }, 500);
    } else {
      clearInterval(timerIdRef.current!);
    }

    return () => clearInterval(timerIdRef.current!);
  }, [gameStateManager.autoPlay, gameStateManager.deck]);

  const isYourTurn = gameStateManager.players.find((player) => player.uuid === uuid && player.isTheirTurn);

  const startGame = () => {
    gameStateManager.startGame();
  };

  return (
    <div className="cards-list">
      GAMEUUID: {gameUuid}
      {gameStateManager.gameState === GameState.NOT_STARTED && (
        <div className="not-started">
          <h1>Game is not started yet</h1>
          <button onClick={startGame}>Start</button>
        </div>
      )}
      {gameStateManager.gameState !== GameState.NOT_STARTED && (
        <>
          <div className="player-row">
            <PlayerBox player={gameStateManager.players[1]} isActive={gameStateManager.players[1]?.isTheirTurn} />
          </div>
          <div className="main-row">
            <PlayerBox player={gameStateManager.players[0]} isActive={gameStateManager.players[0]?.isTheirTurn} />
            <div className="played-cards-container">
              {gameStateManager.playedDeck.length > 0 &&
                gameStateManager.playedDeck.map((card: Card, index: number) => (
                  <div
                    style={{
                      position: "absolute",
                      top: "40%",
                      left: "40%",
                      zIndex: 1000 + index - gameStateManager.playedDeck.length - index,
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
            <PlayerBox player={gameStateManager.players[2]} isActive={gameStateManager.players[2]?.isTheirTurn} />
          </div>
          <div className="player-row">
            <PlayerBox player={gameStateManager.players[3]} isActive={gameStateManager.players[3]?.isTheirTurn} />
          </div>
          <div className="deck-row">
            {gameStateManager.deck.map((card: Card, index: number) => (
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
                checked={gameStateManager.autoPlay}
                onChange={() => gameStateManager.setAutoPlay(!gameStateManager.autoPlay)}
              />
              Auto Play
            </label>
          </div>
        </>
      )}
      {gameStateManager.gameState === GameState.ENDED && (
        <div className="overlay">
          <div className="game-ended">
            <h1>Game ended</h1>
            <p>Final scores:</p>
            {gameStateManager.players.map((player: Player, index: number) => (
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
