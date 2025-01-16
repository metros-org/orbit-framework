import { AgentConfig } from "../agent/types";

export interface MaigaConfig {
    chainId: string;
    rpcUrl: string;
    stage?: string;
    region?: string;
    domainName?: string;
    agents?: AgentConfig[];
}

export interface DatabaseConfig {
    tableName?: string;
    deletionProtection?: boolean;
}

export interface ApiConfig {
    cors?: boolean;
    apiKey?: boolean;
}
