// Logger.ts
export enum LogLevel {
  LOG,
  ERROR,
  EVENT,
}

export interface LogMessage {
  timestamp: string;
  level: LogLevel;
  message: string;
}

export class Logger {
  private logMessages: LogMessage[];

  constructor() {
    this.logMessages = [];
  }

  log(...messages: any[]) {
    const message = messages.map(String).join(" ");
    const timestamp = new Date().toISOString();
    this.logMessages.push({
      timestamp,
      level: LogLevel.LOG,
      message,
    });
    console.log(`${timestamp}: LOG: ${message}`);
  }

  error(...messages: any[]) {
    const message = messages.map(String).join(" ");
    const timestamp = new Date().toISOString();
    this.logMessages.push({
      timestamp,
      level: LogLevel.ERROR,
      message,
    });
    console.error(`${timestamp}: ERROR: ${message}`);
  }

  event(...messages: any[]) {
    const message = messages.map(String).join(" ");
    const timestamp = new Date().toISOString();
    this.logMessages.push({
      timestamp,
      level: LogLevel.EVENT,
      message,
    });
    console.log(`${timestamp}: EVENT: ${message}`);
  }

  getLogs(): LogMessage[] {
    return this.logMessages;
  }
}
