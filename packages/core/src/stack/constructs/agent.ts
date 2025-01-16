import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { AgentConfig } from '../../agent';

export class AgentConstruct extends Construct {
    public readonly handler: lambda.Function;

    constructor(scope: Construct, id: string, config: AgentConfig) {
        super(scope, id);

        // Create Lambda function for agent
        this.handler = new lambda.Function(this, 'Handler', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('lambda/agent'),
            timeout: cdk.Duration.minutes(15),
            memorySize: 1024,
            environment: {
                AGENT_NAME: config.name,
                MODEL_ID: config.modelId,
                MEMORY_ENABLED: config.memory?.toString() || 'false',
            },
        });

        // Add Bedrock permissions
        this.handler.addToRolePolicy(new iam.PolicyStatement({
            actions: ['bedrock:InvokeModel'],
            resources: ['*'], // You might want to restrict this
        }));
    }
}