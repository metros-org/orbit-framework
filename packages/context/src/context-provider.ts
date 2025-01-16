import Redis from 'ioredis';
import NodeCache from 'node-cache';
import { Subject } from 'rxjs';
import { Logger } from '@orbit/core';
import { ContextProvider, TaskMemory } from './types';

export interface ContextProviderConfig {
    redis?: {
        host: string;
        port: number;
        password?: string;
    };
    ttl?: number;
    checkPeriod?: number;
}

export class DefaultContextProvider implements ContextProvider {
    private readonly logger: Logger;
    private readonly redis?: Redis;
    private readonly cache: NodeCache;
    private readonly events: Map<string, Subject<any>>;
    private readonly prefix: string = 'orbit:context:';

    constructor(config: ContextProviderConfig = {}) {
        this.logger = new Logger('ContextProvider');
        this.events = new Map();

        // Initialize Redis if configured
        if (config.redis) {
            this.redis = new Redis({
                host: config.redis.host,
                port: config.redis.port,
                password: config.redis.password,
                retryStrategy: (times) => Math.min(times * 50, 2000)
            });

            this.redis.on('error', (error) => {
                this.logger.error('Redis connection error:', error);
            });
        }

        // Initialize local cache
        this.cache = new NodeCache({
            stdTTL: config.ttl || 3600,
            checkperiod: config.checkPeriod || 600,
            useClones: false
        });
    }

    public async get(key: string): Promise<any> {
        const fullKey = this.getFullKey(key);

        // Try local cache first
        const localValue = this.cache.get(fullKey);
        if (localValue !== undefined) {
            return localValue;
        }

        // Try Redis if available
        if (this.redis) {
            try {
                const value = await this.redis.get(fullKey);
                if (value) {
                    const parsed = JSON.parse(value);
                    this.cache.set(fullKey, parsed);
                    return parsed;
                }
            } catch (error) {
                this.logger.error(`Error getting key ${key} from Redis:`, error);
            }
        }

        return null;
    }

    public async set(key: string, value: any): Promise<void> {
        const fullKey = this.getFullKey(key);
        const serialized = JSON.stringify(value);

        // Set in local cache
        this.cache.set(fullKey, value);

        // Set in Redis if available
        if (this.redis) {
            try {
                await this.redis.set(fullKey, serialized);
            } catch (error) {
                this.logger.error(`Error setting key ${key} in Redis:`, error);
            }
        }
    }

    public async delete(key: string): Promise<void> {
        const fullKey = this.getFullKey(key);

        // Delete from local cache
        this.cache.del(fullKey);

        // Delete from Redis if available
        if (this.redis) {
            try {
                await this.redis.del(fullKey);
            } catch (error) {
                this.logger.error(`Error deleting key ${key} from Redis:`, error);
            }
        }
    }

    public async clear(): Promise<void> {
        // Clear local cache
        this.cache.flushAll();

        // Clear Redis if available
        if (this.redis) {
            try {
                const keys = await this.redis.keys(`${this.prefix}*`);
                if (keys.length > 0) {
                    await this.redis.del(...keys);
                }
            } catch (error) {
                this.logger.error('Error clearing Redis:', error);
            }
        }
    }

    public async getMemory(taskId: string): Promise<TaskMemory> {
        const memory = await this.get(`memory:${taskId}`);
        if (!memory) {
            return {
                shortTerm: {},
                longTerm: {},
                episodic: []
            };
        }
        return memory;
    }

    public async updateMemory(taskId: string, memory: Partial<TaskMemory>): Promise<void> {
        const currentMemory = await this.getMemory(taskId);
        const updatedMemory = {
            ...currentMemory,
            ...memory,
            episodic: [
                ...currentMemory.episodic,
                ...(memory.episodic || [])
            ]
        };
        await this.set(`memory:${taskId}`, updatedMemory);
    }

    public subscribe(event: string, callback: (data: any) => void): void {
        let subject = this.events.get(event);
        if (!subject) {
            subject = new Subject();
            this.events.set(event, subject);
        }
        subject.subscribe(callback);
    }

    public unsubscribe(event: string, callback: (data: any) => void): void {
        const subject = this.events.get(event);
        if (subject) {
            // Note: This is a simplified unsubscribe. In a real implementation,
            // you'd want to keep track of individual subscriptions.
            subject.unsubscribe();
            this.events.delete(event);
        }
    }

    private getFullKey(key: string): string {
        return `${this.prefix}${key}`;
    }

    public async dispose(): Promise<void> {
        // Clear all subscriptions
        this.events.forEach(subject => subject.complete());
        this.events.clear();

        // Disconnect Redis if connected
        if (this.redis) {
            this.redis.disconnect();
        }
    }
} 