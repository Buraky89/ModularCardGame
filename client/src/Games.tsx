import React from "react";
import "./Games.css";

interface Props {
  uuids: string[];
}

const Games: React.FC<Props> = ({ uuids }) => {
  return (
    <div className="games-container">
      {uuids.map((uuid) => (
        <div key={uuid} className="game">
          {uuid}
        </div>
      ))}
    </div>
  );
};

export default Games;
