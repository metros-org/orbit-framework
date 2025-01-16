export interface Tool {
    name: string;
    description: string;
    version: string;
    category?: string;
    metadata?: Record<string, any>;
    
    execute(...args: any[]): Promise<any>;
    validate?(...args: any[]): Promise<boolean>;
    
    getSchema(): ToolSchema;
    getMetadata(): Record<string, any>;
}

export interface ToolSchema {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, ParameterSchema>;
        required?: string[];
    };
    returns: {
        type: string;
        description: string;
    };
}

export interface ParameterSchema {
    type: string;
    description: string;
    enum?: string[];
    minimum?: number;
    maximum?: number;
    pattern?: string;
    format?: string;
    items?: ParameterSchema;
    properties?: Record<string, ParameterSchema>;
    required?: string[];
} 