export interface AgentConfig {
    name: string;
    modelId: string;
    memory?: boolean;
    tools?: string[];
    maxTokens?: number;
    temperature?: number;
}

export interface AgentOptions {
    name: string;
    modelId: string;
    memory?: boolean;
    tools?: string[];
}

export interface AgentResponse {
    output: string;
    metadata?: Record<string, any>;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface AgentContext {
    memory?: any[];
    tools?: Map<string, any>;
    variables?: Record<string, any>;
}