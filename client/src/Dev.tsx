import React from 'react';
import { LogMessage, LogLevel } from './Common/Logger';
import { StateManagerWrapper } from './Common/StateManagerWrapper';
import { State } from './Common/StateManager';

interface DevProps {
  logs: LogMessage[];
  appState: StateManagerWrapper;
}

const Dev: React.FC<DevProps> = ({ logs, appState }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        // Clipboard successfully set
      },
      () => {
        // Clipboard write failed
      }
    );
  };

  return (
    <div>
      <h2>Logs</h2>
      <p>
        State: {State[appState.stateManager.state]}
        <br />
        JWT Token: {appState.stateManager.jwtToken.slice(0, 15)}...
        <button className="copy-button" onClick={() => copyToClipboard(appState.stateManager.jwtToken)}>Copy</button>
        <br />
        Game UUIDs: {appState.stateManager.gameUuids.join(', ')}
        <br />
        Subs Game UUIDs: {appState.stateManager.subscribedGameUuids.join(', ')}
        <br />
        User UUID: {appState.stateManager.userUuid}
      </p>
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        <pre>
          {logs.map((log, index) => (
            <div
              key={index}
              style={{
                color:
                  log.level === LogLevel.ERROR
                    ? 'red'
                    : log.level === LogLevel.LOG
                    ? 'black'
                    : 'blue',
              }}
            >
              [{log.timestamp}, {log.source}] {LogLevel[log.level]}: {log.message}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
};

export default Dev;
