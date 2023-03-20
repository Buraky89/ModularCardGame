import React from "react";
import "./Games.css";

interface Props {
  uuids: string[];
  setLastUuid: React.Dispatch<React.SetStateAction<string>>;
}

const Games: React.FC<Props> = ({ uuids, setLastUuid }) => {
  const handleClick = (uuid: string) => {
    setLastUuid(uuid);
  };

  return (
    <div className="games-container">
      {uuids.map((uuid) => (
        <div key={uuid} className="game" onClick={() => handleClick(uuid)}>
          {uuid}
        </div>
      ))}
    </div>
  );
};

export default Games;
