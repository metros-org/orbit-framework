import { EventEmitter } from 'events';
import { TaskContext } from './context.interface';
import { Tool } from './tool.interface';

export interface AgentConfig {
    name: string;
    description?: string;
    modelId?: string;
    maxTokens?: number;
    temperature?: number;
    tools?: Tool[];
    metadata?: Record<string, any>;
}

export interface AgentCapabilities {
    canStream: boolean;
    supportedTools: string[];
    maxConcurrentTasks: number;
    supportedModels: string[];
}

export interface AgentMetrics {
    totalTasks: number;
    successfulTasks: number;
    failedTasks: number;
    averageResponseTime: number;
    lastActive: Date;
}

export interface AgentResponse<T = any> {
    output: T;
    metadata?: {
        usage?: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
        };
        latency?: number;
        model?: string;
        finishReason?: string;
    };
}

export interface AgentExecuteOptions {
    context?: TaskContext;
    timeout?: number;
    priority?: number;
    retryStrategy?: {
        maxAttempts: number;
        backoff: 'linear' | 'exponential';
        initialDelay: number;
    };
}

export interface IAgent extends EventEmitter {
    readonly name: string;
    readonly capabilities: AgentCapabilities;
    readonly metrics: AgentMetrics;
    
    initialize(): Promise<void>;
    execute(input: string, options?: AgentExecuteOptions): Promise<AgentResponse>;
    stop(): Promise<void>;
    
    addTool(tool: Tool): void;
    removeTool(toolName: string): void;
    
    getStatus(): 'idle' | 'busy' | 'error' | 'stopped';
    getMetrics(): AgentMetrics;
} 