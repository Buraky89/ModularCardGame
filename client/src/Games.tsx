import React from "react";
import "./Games.css";

interface Props {
  uuids: string[];
  onSelect: (uuid: string) => void;
}

const Games: React.FC<Props> = ({ uuids, onSelect }) => {
  return (
    <div className="games-container">
      {uuids.map((uuid) => (
        <div key={uuid} className="game" onClick={() => onSelect(uuid)}>
          {uuid}
        </div>
      ))}
    </div>
  );
};

export default Games;
