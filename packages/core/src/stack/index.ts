import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MaigaConfig } from './types';
import { Database } from './constructs/database';
import { AgentConstruct } from './constructs/agent';
import { Api } from './constructs/api';

export class MaigaStack extends cdk.Stack {
    public readonly database: Database;
    public readonly api: Api;
    private readonly agents: Map<string, AgentConstruct>;

    constructor(scope: Construct, id: string, config: MaigaConfig) {
        super(scope, id, {
            env: {
                region: config.region || process.env.CDK_DEFAULT_REGION,
            },
        });

        // Initialize core infrastructure
        this.database = new Database(this, 'Database', {
            deletionProtection: true,
        });

        this.api = new Api(this, 'Api', {
            cors: true,
            apiKey: true,
        });

        // Initialize agents
        this.agents = new Map();
        if (config.agents) {
            config.agents.forEach(agentConfig => {
                const agent = new AgentConstruct(this, `Agent-${agentConfig.name}`, agentConfig);
                this.agents.set(agentConfig.name, agent);

                // Add API routes for this agent
                this.api.addLambdaRoute(
                    `/agents/${agentConfig.name}`,
                    agent.handler,
                    ['GET', 'POST']
                );
            });
        }

        // Add environment variables to all agent handlers
        this.agents.forEach(agent => {
            agent.handler.addEnvironment('CHAIN_ID', config.chainId);
            agent.handler.addEnvironment('RPC_URL', config.rpcUrl);
            agent.handler.addEnvironment('TABLE_NAME', this.database.table.tableName);
        });
    }

    public addAgent(config: AgentConfig) {
        const agent = new AgentConstruct(this, `Agent-${config.name}`, config);
        this.agents.set(config.name, agent);
        return agent;
    }
}