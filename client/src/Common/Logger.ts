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
  source: string;
}

export class Logger {
  private logMessages: LogMessage[];

  constructor() {
    this.logMessages = [];
  }

  log(source: string, ...messages: any[]) {
    const message = messages.map(String).join(" ");
    const timestamp = new Date().toISOString();
    this.logMessages.push({
      timestamp,
      level: LogLevel.LOG,
      message,
      source,
    });
    console.log(`${timestamp}: LOG: ${message}`);
  }

  error(source: string, ...messages: any[]) {
    const message = messages.map(String).join(" ");
    const timestamp = new Date().toISOString();
    this.logMessages.push({
      timestamp,
      level: LogLevel.ERROR,
      message,
      source,
    });
    console.error(`${timestamp}: ERROR: ${message}`);
  }

  event(source: string, ...messages: any[]) {
    const message = messages.map(String).join(" ");
    const timestamp = new Date().toISOString();
    this.logMessages.push({
      timestamp,
      level: LogLevel.EVENT,
      message,
      source,
    });
    console.log(`${timestamp}: EVENT: ${message}`);
  }

  getLogs(): LogMessage[] {
    return this.logMessages;
  }
}
