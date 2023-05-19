import { Player } from "./Card";

interface PlayerBoxProps {
  player: Player;
  isActive?: boolean;
  isMe?: boolean;
}

export function PlayerBox({ player, isActive, isMe }: PlayerBoxProps) {
  const isPlayerTurn = player?.isTheirTurn;
  return (
    <div
      className={`player-box ${isActive ? "active-player" : ""} ${
        isPlayerTurn ? "player-turn" : ""
      }`}
    >
      <span>{player?.name || "Unknown Player"}</span>
      {isPlayerTurn && <div className="player-turn-dot"></div>}
      {isMe && <span className="me-indicator">(Me)</span>}
      <div className="score-box">
        <span>{player?.points || "0"}</span>
      </div>
    </div>
  );
}
