// Define a Logger interface
interface ILogger {
    info(...message: any[]): void;
    error(...message: any[]): void;
}

// Implement the interface using winston
import { createLogger, format, transports } from 'winston';
const { combine, timestamp, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

export class WinstonLogger implements ILogger {
    private logger;

    constructor() {
        this.logger = createLogger({
            level: 'info',
            format: combine(
                format.label({ label: 'EventManager' }),
                timestamp(),
                myFormat
            ),
            transports: [
                new transports.Console(),
            ],
        });
    }

    info(...message: any[]): void {
        this.logger.info(message.join(' '));
    }

    error(...message: any[]): void {
        this.logger.error(message.join(' '));
    }
}