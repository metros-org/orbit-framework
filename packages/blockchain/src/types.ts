import { BigNumberish } from 'ethers';

export interface NetworkConfig {
    chainId: number;
    name: string;
    rpcUrl: string;
    explorerUrl?: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
}

export interface ContractConfig {
    address: string;
    abi: any[];
    name?: string;
    version?: string;
}

export interface TransactionConfig {
    to: string;
    data?: string;
    value?: BigNumberish;
    gasLimit?: BigNumberish;
    gasPrice?: BigNumberish;
    maxFeePerGas?: BigNumberish;
    maxPriorityFeePerGas?: BigNumberish;
    nonce?: number;
}

export interface TransactionResponse {
    hash: string;
    from: string;
    to: string;
    value: BigNumberish;
    gasLimit: BigNumberish;
    gasPrice: BigNumberish;
    nonce: number;
    data: string;
    chainId: number;
    timestamp?: number;
    status?: 'pending' | 'confirmed' | 'failed';
    receipt?: {
        blockNumber: number;
        blockHash: string;
        transactionIndex: number;
        status: boolean;
        gasUsed: BigNumberish;
        effectiveGasPrice: BigNumberish;
        logs: any[];
    };
}

export interface EventFilter {
    address?: string;
    topics?: (string | string[])[];
    fromBlock?: number | string;
    toBlock?: number | string;
}

export interface EventLog {
    address: string;
    topics: string[];
    data: string;
    blockNumber: number;
    blockHash: string;
    transactionHash: string;
    transactionIndex: number;
    logIndex: number;
    removed: boolean;
}

export interface BlockchainProvider {
    readonly chainId: number;
    readonly network: NetworkConfig;
    
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    
    getBalance(address: string): Promise<BigNumberish>;
    getBlock(blockHashOrNumber: string | number): Promise<any>;
    getTransaction(hash: string): Promise<TransactionResponse>;
    getTransactionCount(address: string): Promise<number>;
    
    sendTransaction(config: TransactionConfig): Promise<TransactionResponse>;
    estimateGas(config: TransactionConfig): Promise<BigNumberish>;
    
    on(event: string | EventFilter, listener: (log: EventLog) => void): void;
    off(event: string | EventFilter, listener: (log: EventLog) => void): void;
    
    call(contract: ContractConfig, method: string, args: any[]): Promise<any>;
    estimateContractGas(contract: ContractConfig, method: string, args: any[]): Promise<BigNumberish>;
} 