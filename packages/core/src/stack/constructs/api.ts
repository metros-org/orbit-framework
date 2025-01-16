import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { ApiConfig } from '../types';

export class Api extends Construct {
    public readonly api: apigateway.RestApi;

    constructor(scope: Construct, id: string, config: ApiConfig = {}) {
        super(scope, id);

        this.api = new apigateway.RestApi(this, 'Api', {
            restApiName: 'Maiga Framework API',
            description: 'API for Maiga Framework',
            defaultCorsPreflightOptions: config.cors ? {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
            } : undefined,
            apiKeySourceType: config.apiKey
                ? apigateway.ApiKeySourceType.HEADER
                : undefined,
        });

        // Add usage plan if API key is enabled
        if (config.apiKey) {
            const plan = this.api.addUsagePlan('UsagePlan', {
                name: 'Standard',
                throttle: {
                    rateLimit: 10,
                    burstLimit: 20,
                },
            });

            const key = this.api.addApiKey('ApiKey');
            plan.addApiKey(key);
        }
    }

    public addLambdaRoute(
        path: string,
        handler: lambda.Function,
        methods: string[] = ['GET']
    ) {
        const resource = this.api.root.resourceForPath(path);

        methods.forEach(method => {
            resource.addMethod(
                method,
                new apigateway.LambdaIntegration(handler)
            );
        });
    }
}