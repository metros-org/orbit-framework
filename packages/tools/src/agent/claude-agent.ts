import { BaseAgent, AgentOptions, AgentResponse } from '@maiga/core';
import axios from 'axios';

interface ClaudeAgentOptions extends AgentOptions {
    apiKey: string;
    apiUrl: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
}

export class ClaudeAgent extends BaseAgent {
    private apiKey: string;
    private apiUrl: string;
    private temperature: number;
    private maxTokens: number;
    private topP: number;
    private frequencyPenalty: number;
    private presencePenalty: number;

    constructor(options: ClaudeAgentOptions) {
        super(options);
        this.apiKey = options.apiKey;
        this.apiUrl = options.apiUrl;
        this.temperature = options.temperature || 0.7;
        this.maxTokens = options.maxTokens || 2000;
        this.topP = options.topP || 1.0;
        this.frequencyPenalty = options.frequencyPenalty || 0.0;
        this.presencePenalty = options.presencePenalty || 0.0;
    }

    async initialize(): Promise<void> {
        this.logger.info('Initializing Claude agent');
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
            const response = await axios.post(this.apiUrl, {
                prompt: this.formatPrompt(input),
                max_tokens: this.maxTokens,
                temperature: this.temperature,
                top_p: this.topP,
                frequency_penalty: this.frequencyPenalty,
                presence_penalty: this.presencePenalty,
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = response.data.completion || '';

            return { output: result.trim() };
        } catch (error) {
            this.logger.error('Execution error:', error);
            throw new Error(`Failed to execute command: ${error.message}`);
        }
    }

    async stop(): Promise<void> {
        this.logger.info('Stopping Claude agent');
        this.emit('stopped');
    }
}