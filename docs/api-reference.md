# API Reference

## Core Package (@orbit/core)

### Orchestrator

The main orchestration engine that manages agents and tasks.

```typescript
class Orchestrator implements IOrchestrator {
    constructor(config: OrchestratorConfig);
    
    // Core methods
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    
    // Agent management
    addAgent(agent: IAgent): void;
    removeAgent(agentName: string): void;
    
    // Tool management
    addTool(tool: Tool): void;
    removeTool(toolName: string): void;
    
    // Task management
    submitTask(task: TaskDefinition): Promise<TaskResult>;
    cancelTask(taskId: string): Promise<void>;
    getTaskStatus(taskId: string): Promise<TaskResult | null>;
    
    // Metrics
    getMetrics(): IOrchestratorMetrics;
}
```

#### Configuration

```typescript
interface OrchestratorConfig {
    agents?: IAgent[];
    tools?: Tool[];
    maxConcurrentTasks?: number;
    defaultTimeout?: number;
    retryStrategy?: RetryStrategy;
}

interface RetryStrategy {
    maxAttempts: number;
    backoff: 'linear' | 'exponential';
    initialDelay: number;
}
```

### Agents

Base agent implementation and types.

```typescript
abstract class BaseAgent implements IAgent {
    constructor(config: AgentConfig);
    
    // Lifecycle methods
    abstract initialize(): Promise<void>;
    abstract execute(input: string, options?: AgentExecuteOptions): Promise<AgentResponse>;
    abstract stop(): Promise<void>;
    
    // Tool management
    addTool(tool: Tool): void;
    removeTool(toolName: string): void;
    
    // Status and metrics
    getStatus(): 'idle' | 'busy' | 'error' | 'stopped';
    getMetrics(): AgentMetrics;
}
```

#### Agent Types

```typescript
interface AgentConfig {
    name: string;
    description?: string;
    modelId?: string;
    maxTokens?: number;
    temperature?: number;
    tools?: Tool[];
    metadata?: Record<string, any>;
}

interface AgentCapabilities {
    canStream: boolean;
    supportedTools: string[];
    maxConcurrentTasks: number;
    supportedModels: string[];
}

interface AgentMetrics {
    totalTasks: number;
    successfulTasks: number;
    failedTasks: number;
    averageResponseTime: number;
    lastActive: Date;
}
```

### Tools

Base tool implementation and types.

```typescript
abstract class BaseTool implements Tool {
    constructor(options: ToolOptions);
    
    // Core methods
    abstract execute(...args: any[]): Promise<any>;
    abstract validate?(...args: any[]): Promise<boolean>;
    abstract getSchema(): ToolSchema;
    
    // Metadata
    getMetadata(): Record<string, any>;
}
```

#### Tool Types

```typescript
interface ToolOptions {
    name: string;
    description: string;
    version: string;
    category?: string;
    metadata?: Record<string, any>;
}

interface ToolSchema {
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
```

## Context Package (@orbit/context)

### Context Provider

Manages task context and memory.

```typescript
class DefaultContextProvider implements ContextProvider {
    constructor(config: ContextProviderConfig);
    
    // Core methods
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    
    // Memory management
    getMemory(taskId: string): Promise<TaskMemory>;
    updateMemory(taskId: string, memory: Partial<TaskMemory>): Promise<void>;
    
    // Event handling
    subscribe(event: string, callback: (data: any) => void): void;
    unsubscribe(event: string, callback: (data: any) => void): void;
    
    // Cleanup
    dispose(): Promise<void>;
}
```

## Blockchain Package (@orbit/blockchain)

### Ethereum Provider

Manages Ethereum blockchain interactions.

```typescript
class EthereumProvider implements BlockchainProvider {
    constructor(network: NetworkConfig);
    
    // Connection
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    
    // Basic operations
    getBalance(address: string): Promise<BigNumberish>;
    getBlock(blockHashOrNumber: string | number): Promise<any>;
    getTransaction(hash: string): Promise<TransactionResponse>;
    getTransactionCount(address: string): Promise<number>;
    
    // Transaction handling
    sendTransaction(config: TransactionConfig): Promise<TransactionResponse>;
    estimateGas(config: TransactionConfig): Promise<BigNumberish>;
    
    // Contract interaction
    call(contract: ContractConfig, method: string, args: any[]): Promise<any>;
    estimateContractGas(contract: ContractConfig, method: string, args: any[]): Promise<BigNumberish>;
}
```

### DeFi Protocols

#### Uniswap Integration

```typescript
class UniswapProtocol {
    constructor(provider: BlockchainProvider, config: UniswapConfig);
    
    // Pool operations
    getPool(tokenA: string, tokenB: string, fee: number): Promise<string>;
    getPoolData(poolAddress: string): Promise<Pool>;
    
    // Trading operations
    quoteExactInputSingle(tokenIn: string, tokenOut: string, fee: number, amountIn: BigNumberish): Promise<BigNumberish>;
    swap(params: SwapParams): Promise<string>;
    
    // Liquidity operations
    addLiquidity(tokenA: string, tokenB: string, fee: number, ...params: any[]): Promise<string>;
}
```

#### Aave Integration

```typescript
class AaveProtocol {
    constructor(provider: BlockchainProvider, config: AaveConfig);
    
    // Market data
    getReserveData(asset: string): Promise<ReserveData>;
    getUserAccountData(user: string): Promise<UserAccountData>;
    
    // Lending operations
    supply(asset: string, amount: BigNumberish, onBehalfOf: string, referralCode?: number): Promise<string>;
    borrow(asset: string, amount: BigNumberish, ...params: any[]): Promise<string>;
    repay(asset: string, amount: BigNumberish, ...params: any[]): Promise<string>;
    withdraw(asset: string, amount: BigNumberish, to: string): Promise<string>;
}
```

## Security Package (@orbit/security)

### Security Provider

Handles secure communication and encryption.

```typescript
class DefaultSecurityProvider implements SecurityProvider {
    constructor(config: SecurityConfig);
    
    // Key generation
    generateEncryptionKey(): Promise<EncryptionKey>;
    generateSigningKey(): Promise<SigningKey>;
    
    // Encryption
    encrypt(message: string, recipientPublicKey: string): Promise<EncryptedMessage>;
    decrypt(message: EncryptedMessage, privateKey: string): Promise<string>;
    
    // Signing
    sign(message: string | EncryptedMessage, privateKey: string): Promise<SignedMessage>;
    verify(signedMessage: SignedMessage): Promise<boolean>;
    
    // Key exchange
    deriveSharedSecret(privateKey: string, publicKey: string): Promise<string>;
} 