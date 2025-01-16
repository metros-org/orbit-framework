export interface TaskMemory {
    shortTerm: Record<string, any>;
    longTerm: Record<string, any>;
    episodic: TaskMemoryEpisode[];
}

export interface TaskMemoryEpisode {
    timestamp: Date;
    type: 'input' | 'output' | 'error' | 'event';
    content: any;
    metadata?: Record<string, any>;
}

export interface ContextProvider {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    
    getMemory(taskId: string): Promise<TaskMemory>;
    updateMemory(taskId: string, memory: Partial<TaskMemory>): Promise<void>;
    
    subscribe(event: string, callback: (data: any) => void): void;
    unsubscribe(event: string, callback: (data: any) => void): void;
    
    dispose(): Promise<void>;
} 