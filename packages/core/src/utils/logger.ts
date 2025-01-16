import winston from 'winston';

export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error'
}

export interface LoggerOptions {
    level?: LogLevel;
    prefix?: string;
    metadata?: Record<string, any>;
}

export class Logger {
    private logger: winston.Logger;
    private prefix: string;
    private metadata: Record<string, any>;

    constructor(prefix?: string, options: LoggerOptions = {}) {
        this.prefix = prefix || '';
        this.metadata = options.metadata || {};

        this.logger = winston.createLogger({
            level: options.level || LogLevel.INFO,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                })
            ]
        });
    }

    private formatMessage(message: string, metadata?: Record<string, any>): any {
        return {
            message,
            prefix: this.prefix,
            timestamp: new Date().toISOString(),
            ...this.metadata,
            ...metadata
        };
    }

    public debug(message: string, metadata?: Record<string, any>): void {
        this.logger.debug(this.formatMessage(message, metadata));
    }

    public info(message: string, metadata?: Record<string, any>): void {
        this.logger.info(this.formatMessage(message, metadata));
    }

    public warn(message: string, metadata?: Record<string, any>): void {
        this.logger.warn(this.formatMessage(message, metadata));
    }

    public error(message: string, error?: any): void {
        this.logger.error(this.formatMessage(message, {
            error: error?.message || error,
            stack: error?.stack
        }));
    }

    public setLevel(level: LogLevel): void {
        this.logger.level = level;
    }

    public addMetadata(metadata: Record<string, any>): void {
        this.metadata = { ...this.metadata, ...metadata };
    }

    public child(options: LoggerOptions): Logger {
        return new Logger(
            options.prefix || this.prefix,
            {
                level: options.level || (this.logger.level as LogLevel),
                metadata: { ...this.metadata, ...options.metadata }
            }
        );
    }
}