import { Tool, ToolSchema } from '../interfaces';
import { Logger } from '../utils/logger';

export abstract class BaseTool implements Tool {
    protected readonly logger: Logger;
    
    public readonly name: string;
    public readonly description: string;
    public readonly version: string;
    public readonly category?: string;
    public readonly metadata?: Record<string, any>;

    constructor(options: {
        name: string;
        description: string;
        version: string;
        category?: string;
        metadata?: Record<string, any>;
    }) {
        this.name = options.name;
        this.description = options.description;
        this.version = options.version;
        this.category = options.category;
        this.metadata = options.metadata;
        
        this.logger = new Logger(`Tool:${this.name}`);
    }

    abstract execute(...args: any[]): Promise<any>;
    abstract validate?(...args: any[]): Promise<boolean>;
    abstract getSchema(): ToolSchema;

    public getMetadata(): Record<string, any> {
        return {
            name: this.name,
            description: this.description,
            version: this.version,
            category: this.category,
            ...this.metadata
        };
    }

    protected validateArgs(args: any[], schema: ToolSchema): boolean {
        const { parameters } = schema;
        
        // Check required parameters
        if (parameters.required) {
            for (const required of parameters.required) {
                if (!(required in args)) {
                    this.logger.error(`Missing required parameter: ${required}`);
                    return false;
                }
            }
        }

        // Validate each parameter
        for (const [key, value] of Object.entries(args)) {
            const paramSchema = parameters.properties[key];
            if (!paramSchema) {
                this.logger.warn(`Unknown parameter: ${key}`);
                continue;
            }

            if (!this.validateValue(value, paramSchema)) {
                this.logger.error(`Invalid value for parameter ${key}`);
                return false;
            }
        }

        return true;
    }

    private validateValue(value: any, schema: any): boolean {
        switch (schema.type) {
            case 'string':
                if (typeof value !== 'string') return false;
                if (schema.pattern && !new RegExp(schema.pattern).test(value)) return false;
                if (schema.enum && !schema.enum.includes(value)) return false;
                break;

            case 'number':
                if (typeof value !== 'number') return false;
                if (schema.minimum !== undefined && value < schema.minimum) return false;
                if (schema.maximum !== undefined && value > schema.maximum) return false;
                break;

            case 'boolean':
                if (typeof value !== 'boolean') return false;
                break;

            case 'array':
                if (!Array.isArray(value)) return false;
                if (schema.items) {
                    for (const item of value) {
                        if (!this.validateValue(item, schema.items)) return false;
                    }
                }
                break;

            case 'object':
                if (typeof value !== 'object' || value === null) return false;
                if (schema.properties) {
                    for (const [propKey, propSchema] of Object.entries(schema.properties)) {
                        if (schema.required?.includes(propKey) && !(propKey in value)) return false;
                        if (propKey in value && !this.validateValue(value[propKey], propSchema)) return false;
                    }
                }
                break;

            default:
                this.logger.warn(`Unknown schema type: ${schema.type}`);
                return false;
        }

        return true;
    }
} 