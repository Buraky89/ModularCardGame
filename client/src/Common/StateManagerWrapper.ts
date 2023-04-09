import { StateManager } from "./StateManager";

export class StateManagerWrapper {
  public stateManager: StateManager;
  private version: number;

  constructor(stateManager: StateManager, version: number) {
    this.stateManager = stateManager;
    this.version = version;
  }
}

export default StateManagerWrapper;
