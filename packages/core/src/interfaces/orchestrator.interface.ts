import { IAgent } from './agent.interface';
import { Tool } from './tool.interface';
import { TaskContext } from './context.interface';

export interface OrchestratorConfig {
    agents?: IAgent[];
    tools?: Tool[];
    maxConcurrentTasks?: number;
    defaultTimeout?: number;
    retryStrategy?: RetryStrategy;
}

export interface RetryStrategy {
    maxAttempts: number;
    backoff: 'linear' | 'exponential';
    initialDelay: number;
}

export interface TaskDefinition {
    id: string;
    type: string;
    input: any;
    context?: TaskContext;
    agentPreference?: string[];
    priority?: number;
    timeout?: number;
    retryStrategy?: RetryStrategy;
}

export interface TaskResult {
    taskId: string;
    status: 'success' | 'failure' | 'timeout' | 'cancelled';
    output?: any;
    error?: Error;
    metrics: {
        startTime: Date;
        endTime: Date;
        duration: number;
        retries: number;
        agentName: string;
    };
}

export interface IOrchestratorMetrics {
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageTaskDuration: number;
    agentMetrics: Record<string, {
        totalTasks: number;
        successRate: number;
        averageResponseTime: number;
    }>;
}

export interface IOrchestrator {
    readonly agents: Map<string, IAgent>;
    readonly tools: Map<string, Tool>;
    readonly metrics: IOrchestratorMetrics;

    initialize(): Promise<void>;
    shutdown(): Promise<void>;

    addAgent(agent: IAgent): void;
    removeAgent(agentName: string): void;

    addTool(tool: Tool): void;
    removeTool(toolName: string): void;

    submitTask(task: TaskDefinition): Promise<TaskResult>;
    cancelTask(taskId: string): Promise<void>;

    getTaskStatus(taskId: string): Promise<TaskResult | null>;
    getMetrics(): IOrchestratorMetrics;
} 