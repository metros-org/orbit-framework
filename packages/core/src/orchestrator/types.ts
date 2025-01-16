export interface OrchestratorConfig {
    maxConcurrent?: number;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
}

export interface TaskConfig {
    id: string;
    agents: string[];
    input: string;
    priority?: number;
    metadata?: Record<string, any>;
    dependencies?: string[];
}

export interface TaskResult {
    taskId: string;
    status: 'success' | 'failure' | 'timeout';
    results: Array<{
        agentName: string;
        output: string;
        error?: string;
        duration?: number;
    }>;
    metadata?: Record<string, any>;
    timestamp: number;
}

export interface TaskProgress {
    taskId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    currentAgent?: string;
    startTime: number;
    lastUpdate: number;
}