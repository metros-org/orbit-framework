import { BaseAgent, AgentOptions, AgentResponse } from '@maiga/core';
import { Configuration, OpenAIApi } from 'openai';

interface OpenAIAgentOptions extends AgentOptions {
    apiKey: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
}

export class OpenAIAgent extends BaseAgent {
    private openai: OpenAIApi;
    private temperature: number;
    private maxTokens: number;
    private topP: number;
    private frequencyPenalty: number;
    private presencePenalty: number;

    constructor(options: OpenAIAgentOptions) {
        super(options);
        const configuration = new Configuration({
            apiKey: options.apiKey,
        });
        this.openai = new OpenAIApi(configuration);
        this.temperature = options.temperature || 0.7;
        this.maxTokens = options.maxTokens || 2000;
        this.topP = options.topP || 1.0;
        this.frequencyPenalty = options.frequencyPenalty || 0.0;
        this.presencePenalty = options.presencePenalty || 0.0;
    }

    async initialize(): Promise<void> {
        this.logger.info('Initializing OpenAI agent');
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
            const response = await this.openai.createCompletion({
                model: this.modelId,
                prompt: this.formatPrompt(input),
                max_tokens: this.maxTokens,
                temperature: this.temperature,
                top_p: this.topP,
                frequency_penalty: this.frequencyPenalty,
                presence_penalty: this.presencePenalty,
            });

            const result = response.data.choices[0].text || '';

            return { output: result.trim() };
        } catch (error) {
            this.logger.error('Execution error:', error);
            throw new Error(`Failed to execute command: ${error.message}`);
        }
    }

    async stop(): Promise<void> {
        this.logger.info('Stopping OpenAI agent');
        this.emit('stopped');
    }
}