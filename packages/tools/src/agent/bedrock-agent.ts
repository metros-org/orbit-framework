import { BaseAgent, AgentOptions, AgentResponse } from '@maiga/core';
import { BedrockRuntimeClient, InvokeModelCommand, InvokeModelCommandInput } from '@aws-sdk/client-bedrock-runtime';

interface BedrockAgentOptions extends AgentOptions {
    region?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
}

export class BedrockAgent extends BaseAgent {
    private client: BedrockRuntimeClient;
    private temperature: number;
    private maxTokens: number;
    private topP: number;
    private frequencyPenalty: number;
    private presencePenalty: number;

    constructor(options: BedrockAgentOptions) {
        super(options);
        this.client = new BedrockRuntimeClient({ region: options.region || 'us-east-1' });
        this.temperature = options.temperature || 0.7;
        this.maxTokens = options.maxTokens || 2000;
        this.topP = options.topP || 1.0;
        this.frequencyPenalty = options.frequencyPenalty || 0.0;
        this.presencePenalty = options.presencePenalty || 0.0;
    }

    async initialize(): Promise<void> {
        this.logger.info('Initializing Bedrock agent');
        this.emit('ready');
    }

    private formatPrompt(input: string, context?: string[]): string {
        let prompt = `You are an AI assistant.`;
        if (context && context.length > 0) {
            prompt += `\nContext:\n${context.join('\n')}`;
        }
        prompt += `\n\nUser: ${input}\nAI:`;
        return prompt;
    }

    async execute(input: string): Promise<AgentResponse> {
        try {
            const commandInput: InvokeModelCommandInput = {
                modelId: this.modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify({
                    prompt: this.formatPrompt(input),
                    max_tokens: this.maxTokens,
                    temperature: this.temperature,
                    top_p: this.topP,
                    frequency_penalty: this.frequencyPenalty,
                    presence_penalty: this.presencePenalty
                })
            };

            const command = new InvokeModelCommand(commandInput);
            const response = await this.client.send(command);
            const result = JSON.parse(new TextDecoder().decode(response.body));

            if (result.tool_calls) {
                await this.handleToolCalls(result.tool_calls);
            }

            return { output: result.completion || result.content[0].text };
        } catch (error) {
            this.logger.error('Execution error:', error);
            throw new Error(`Failed to execute command: ${error.message}`);
        }
    }

    async handleToolCalls(toolCalls: any[]): Promise<void> {
        for (const call of toolCalls) {
            try {
                const tool = this.tools.get(call.name);
                if (tool) {
                    await this.useTool(call.name, ...call.arguments);
                }
            } catch (error) {
                this.logger.error(`Error executing tool ${call.name}:`, error);
            }
        }
    }

    async stop(): Promise<void> {
        this.logger.info('Stopping Bedrock agent');
        this.emit('stopped');
    }
}