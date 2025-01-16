export interface ToolMetadata {
    name: string;
    description: string;
    version: string;
}

export abstract class BaseTool {
    protected metadata: ToolMetadata;

    constructor(metadata: ToolMetadata) {
        this.metadata = metadata;
    }

    abstract execute(...args: any[]): Promise<any>;

    getMetadata(): ToolMetadata {
        return this.metadata;
    }
}