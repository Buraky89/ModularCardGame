import { Player } from "./Card";

interface PlayerBoxProps {
  player: Player;
  isActive?: boolean;
}

export function PlayerBox({ player, isActive }: PlayerBoxProps) {
  return (
    <div className={`player-box ${isActive ? "active-player" : ""}`}>
      <span>{player?.name || "Unknown Player"}</span>
      <div className="score-box">
        <span>{player?.points || "0"}</span>
      </div>
    </div>
  );
}
