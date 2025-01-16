import { EventEmitter } from 'events';
import {
    IAgent,
    AgentConfig,
    AgentCapabilities,
    AgentMetrics,
    AgentResponse,
    AgentExecuteOptions,
    Tool
} from '../interfaces';
import { Logger } from '../utils/logger';

export abstract class BaseAgent extends EventEmitter implements IAgent {
    protected readonly logger: Logger;
    protected readonly tools: Map<string, Tool>;
    protected status: 'idle' | 'busy' | 'error' | 'stopped';

    public readonly name: string;
    public readonly capabilities: AgentCapabilities;
    public readonly metrics: AgentMetrics;

    constructor(config: AgentConfig) {
        super();
        this.name = config.name;
        this.logger = new Logger(`Agent:${this.name}`);
        this.tools = new Map();
        this.status = 'idle';

        // Initialize metrics
        this.metrics = {
            totalTasks: 0,
            successfulTasks: 0,
            failedTasks: 0,
            averageResponseTime: 0,
            lastActive: new Date()
        };

        // Initialize capabilities
        this.capabilities = {
            canStream: false,
            supportedTools: [],
            maxConcurrentTasks: 1,
            supportedModels: []
        };

        // Add tools if provided
        if (config.tools) {
            config.tools.forEach(tool => this.addTool(tool));
        }
    }

    abstract initialize(): Promise<void>;
    abstract execute(input: string, options?: AgentExecuteOptions): Promise<AgentResponse>;
    abstract stop(): Promise<void>;

    public addTool(tool: Tool): void {
        this.tools.set(tool.name, tool);
        this.capabilities.supportedTools.push(tool.name);
        this.logger.info(`Tool added: ${tool.name}`);
    }

    public removeTool(toolName: string): void {
        if (this.tools.delete(toolName)) {
            this.capabilities.supportedTools = this.capabilities.supportedTools.filter(
                name => name !== toolName
            );
            this.logger.info(`Tool removed: ${toolName}`);
        }
    }

    public getStatus(): 'idle' | 'busy' | 'error' | 'stopped' {
        return this.status;
    }

    public getMetrics(): AgentMetrics {
        return { ...this.metrics };
    }

    protected async useTool(toolName: string, ...args: any[]): Promise<any> {
        const tool = this.tools.get(toolName);
        if (!tool) {
            throw new Error(`Tool not found: ${toolName}`);
        }

        try {
            if (tool.validate) {
                const isValid = await tool.validate(...args);
                if (!isValid) {
                    throw new Error(`Tool validation failed: ${toolName}`);
                }
            }

            this.logger.debug(`Using tool: ${toolName}`, { args });
            const result = await tool.execute(...args);
            this.logger.debug(`Tool ${toolName} result:`, { result });
            return result;
        } catch (error) {
            this.logger.error(`Tool ${toolName} error:`, error);
            throw error;
        }
    }

    protected updateMetrics(startTime: number, success: boolean): void {
        const duration = Date.now() - startTime;
        
        (this.metrics as any).totalTasks++;
        if (success) {
            (this.metrics as any).successfulTasks++;
        } else {
            (this.metrics as any).failedTasks++;
        }

        // Update average response time
        const totalTime = this.metrics.averageResponseTime * (this.metrics.totalTasks - 1) + duration;
        (this.metrics as any).averageResponseTime = totalTime / this.metrics.totalTasks;
        (this.metrics as any).lastActive = new Date();
    }
}