import { Player } from "./Card";

interface PlayerBoxProps {
  player: Player;
  isActive?: boolean;
}

export function PlayerBox({ player, isActive }: PlayerBoxProps) {
  const isPlayerTurn = player?.isTheirTurn;
  return (
    <div
      className={`player-box ${isActive ? "active-player" : ""} ${
        isPlayerTurn ? "player-turn" : ""
      }`}
    >
      <span>{player?.name || "Unknown Player"}</span>
      {isPlayerTurn && <div className="player-turn-dot"></div>}
      <div className="score-box">
        <span>{player?.points || "0"}</span>
      </div>
    </div>
  );
}
