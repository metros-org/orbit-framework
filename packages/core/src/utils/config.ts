import { z } from 'zod';

// Configuration schema
const configSchema = z.object({
    chainId: z.string(),
    rpcUrl: z.string().url(),
    stage: z.string().optional(),
    region: z.string().optional(),
    domainName: z.string().optional(),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).optional(),
    agents: z.array(z.object({
        name: z.string(),
        modelId: z.string(),
        memory: z.boolean().optional(),
        tools: z.array(z.string()).optional(),
    })).optional(),
});

export type Config = z.infer<typeof configSchema>;

export class ConfigLoader {
    private static instance: ConfigLoader;
    private config: Config;

    private constructor() {
        this.config = this.loadConfig();
    }

    public static getInstance(): ConfigLoader {
        if (!ConfigLoader.instance) {
            ConfigLoader.instance = new ConfigLoader();
        }
        return ConfigLoader.instance;
    }

    private loadConfig(): Config {
        // Load from environment variables
        const config = {
            chainId: process.env.CHAIN_ID,
            rpcUrl: process.env.RPC_URL,
            stage: process.env.STAGE,
            region: process.env.REGION,
            domainName: process.env.DOMAIN_NAME,
            logLevel: process.env.LOG_LEVEL,
        };

        // Validate config
        const result = configSchema.safeParse(config);

        if (!result.success) {
            throw new Error(`Invalid configuration: ${result.error.message}`);
        }

        return result.data;
    }

    public getConfig(): Config {
        return this.config;
    }

    public updateConfig(newConfig: Partial<Config>) {
        this.config = {
            ...this.config,
            ...newConfig,
        };
    }
}

// Helper functions
export function getConfig(): Config {
    return ConfigLoader.getInstance().getConfig();
}

export function updateConfig(config: Partial<Config>) {
    return ConfigLoader.getInstance().updateConfig(config);
}