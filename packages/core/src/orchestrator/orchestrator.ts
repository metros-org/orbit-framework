import { EventEmitter } from 'events';
import {
    IOrchestrator,
    OrchestratorConfig,
    TaskDefinition,
    TaskResult,
    IOrchestratorMetrics,
    IAgent,
    Tool,
    AgentResponse
} from '../interfaces';
import { Logger } from '../utils/logger';

export class Orchestrator extends EventEmitter implements IOrchestrator {
    private readonly logger: Logger;
    private readonly maxConcurrentTasks: number;
    private readonly defaultTimeout: number;
    private readonly activeTasks: Map<string, TaskDefinition>;
    private readonly taskResults: Map<string, TaskResult>;

    public readonly agents: Map<string, IAgent>;
    public readonly tools: Map<string, Tool>;
    public readonly metrics: IOrchestratorMetrics;

    constructor(config: OrchestratorConfig = {}) {
        super();
        this.logger = new Logger('Orchestrator');
        this.agents = new Map();
        this.tools = new Map();
        this.activeTasks = new Map();
        this.taskResults = new Map();

        this.maxConcurrentTasks = config.maxConcurrentTasks || 10;
        this.defaultTimeout = config.defaultTimeout || 30000;

        // Initialize metrics
        this.metrics = {
            totalTasks: 0,
            activeTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            averageTaskDuration: 0,
            agentMetrics: {}
        };

        // Add agents if provided
        if (config.agents) {
            config.agents.forEach(agent => this.addAgent(agent));
        }

        // Add tools if provided
        if (config.tools) {
            config.tools.forEach(tool => this.addTool(tool));
        }
    }

    public async initialize(): Promise<void> {
        this.logger.info('Initializing orchestrator');
        
        // Initialize all agents
        const initPromises = Array.from(this.agents.values()).map(agent => {
            return agent.initialize().catch(error => {
                this.logger.error(`Failed to initialize agent ${agent.name}:`, error);
                throw error;
            });
        });

        await Promise.all(initPromises);
        this.logger.info('Orchestrator initialized');
    }

    public async shutdown(): Promise<void> {
        this.logger.info('Shutting down orchestrator');

        // Stop all active tasks
        for (const taskId of this.activeTasks.keys()) {
            await this.cancelTask(taskId);
        }

        // Stop all agents
        const stopPromises = Array.from(this.agents.values()).map(agent => {
            return agent.stop().catch(error => {
                this.logger.error(`Failed to stop agent ${agent.name}:`, error);
            });
        });

        await Promise.all(stopPromises);
        this.logger.info('Orchestrator shut down');
    }

    public addAgent(agent: IAgent): void {
        this.agents.set(agent.name, agent);
        this.metrics.agentMetrics[agent.name] = {
            totalTasks: 0,
            successRate: 0,
            averageResponseTime: 0
        };
        this.logger.info(`Agent added: ${agent.name}`);
    }

    public removeAgent(agentName: string): void {
        const agent = this.agents.get(agentName);
        if (agent) {
            agent.stop().catch(error => {
                this.logger.error(`Error stopping agent ${agentName}:`, error);
            });
            this.agents.delete(agentName);
            delete this.metrics.agentMetrics[agentName];
            this.logger.info(`Agent removed: ${agentName}`);
        }
    }

    public addTool(tool: Tool): void {
        this.tools.set(tool.name, tool);
        this.logger.info(`Tool added: ${tool.name}`);
    }

    public removeTool(toolName: string): void {
        if (this.tools.delete(toolName)) {
            this.logger.info(`Tool removed: ${toolName}`);
        }
    }

    public async submitTask(task: TaskDefinition): Promise<TaskResult> {
        if (this.activeTasks.size >= this.maxConcurrentTasks) {
            throw new Error('Maximum concurrent tasks reached');
        }

        this.logger.info(`Submitting task: ${task.id}`, { task });
        this.activeTasks.set(task.id, task);
        this.metrics.activeTasks++;
        this.metrics.totalTasks++;

        try {
            const agent = await this.selectAgent(task);
            const startTime = Date.now();

            const result = await Promise.race([
                agent.execute(task.input, {
                    context: task.context,
                    timeout: task.timeout || this.defaultTimeout,
                    priority: task.priority,
                    retryStrategy: task.retryStrategy
                }),
                new Promise<AgentResponse>((_, reject) => 
                    setTimeout(() => reject(new Error('Task timeout')), 
                    task.timeout || this.defaultTimeout)
                )
            ]);

            const endTime = Date.now();
            const duration = endTime - startTime;

            const taskResult: TaskResult = {
                taskId: task.id,
                status: 'success',
                output: result.output,
                metrics: {
                    startTime: new Date(startTime),
                    endTime: new Date(endTime),
                    duration,
                    retries: 0,
                    agentName: agent.name
                }
            };

            this.updateMetrics(agent.name, duration, true);
            this.taskResults.set(task.id, taskResult);
            return taskResult;

        } catch (error: unknown) {
            const taskResult: TaskResult = {
                taskId: task.id,
                status: error instanceof Error && error.message === 'Task timeout' ? 'timeout' : 'failure',
                error: error instanceof Error ? error : new Error(String(error)),
                metrics: {
                    startTime: new Date(),
                    endTime: new Date(),
                    duration: 0,
                    retries: 0,
                    agentName: ''
                }
            };

            this.updateMetrics('', 0, false);
            this.taskResults.set(task.id, taskResult);
            throw error;

        } finally {
            this.activeTasks.delete(task.id);
            this.metrics.activeTasks--;
        }
    }

    public async cancelTask(taskId: string): Promise<void> {
        const task = this.activeTasks.get(taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }

        this.logger.info(`Cancelling task: ${taskId}`);
        this.activeTasks.delete(taskId);
        this.metrics.activeTasks--;

        const taskResult: TaskResult = {
            taskId,
            status: 'cancelled',
            metrics: {
                startTime: new Date(),
                endTime: new Date(),
                duration: 0,
                retries: 0,
                agentName: ''
            }
        };

        this.taskResults.set(taskId, taskResult);
    }

    public async getTaskStatus(taskId: string): Promise<TaskResult | null> {
        return this.taskResults.get(taskId) || null;
    }

    public getMetrics(): IOrchestratorMetrics {
        return { ...this.metrics };
    }

    private async selectAgent(task: TaskDefinition): Promise<IAgent> {
        const availableAgents = Array.from(this.agents.values()).filter(
            agent => agent.getStatus() === 'idle'
        );

        if (availableAgents.length === 0) {
            throw new Error('No available agents');
        }

        if (task.agentPreference) {
            for (const preferredName of task.agentPreference) {
                const agent = availableAgents.find(a => a.name === preferredName);
                if (agent) return agent;
            }
        }

        // Simple round-robin selection for now
        // TODO: Implement more sophisticated agent selection
        return availableAgents[0];
    }

    private updateMetrics(agentName: string, duration: number, success: boolean): void {
        if (success) {
            this.metrics.completedTasks++;
        } else {
            this.metrics.failedTasks++;
        }

        // Update average task duration
        const totalDuration = this.metrics.averageTaskDuration * (this.metrics.totalTasks - 1) + duration;
        this.metrics.averageTaskDuration = totalDuration / this.metrics.totalTasks;

        // Update agent metrics
        if (agentName && this.metrics.agentMetrics[agentName]) {
            const agentMetrics = this.metrics.agentMetrics[agentName];
            agentMetrics.totalTasks++;
            agentMetrics.successRate = (agentMetrics.successRate * (agentMetrics.totalTasks - 1) + (success ? 1 : 0)) / agentMetrics.totalTasks;
            agentMetrics.averageResponseTime = (agentMetrics.averageResponseTime * (agentMetrics.totalTasks - 1) + duration) / agentMetrics.totalTasks;
        }
    }
}