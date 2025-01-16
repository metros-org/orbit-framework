import { ethers, BigNumberish } from 'ethers';
import { Logger } from '@orbit/core';
import {
    BlockchainProvider,
    NetworkConfig,
    ContractConfig,
    TransactionConfig,
    TransactionResponse,
    EventFilter,
    EventLog
} from '../types';

export class EthereumProvider implements BlockchainProvider {
    private readonly logger: Logger;
    private provider: ethers.JsonRpcProvider;
    private signer?: ethers.Signer;

    public readonly chainId: number;
    public readonly network: NetworkConfig;

    constructor(network: NetworkConfig) {
        this.logger = new Logger(`EthereumProvider:${network.name}`);
        this.network = network;
        this.chainId = network.chainId;
        this.provider = new ethers.JsonRpcProvider(network.rpcUrl);
    }

    public async connect(): Promise<void> {
        try {
            await this.provider.getNetwork();
            this.logger.info('Connected to network', {
                chainId: this.chainId,
                name: this.network.name
            });
        } catch (error) {
            this.logger.error('Failed to connect to network:', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        // Clean up any subscriptions or connections
        this.provider.removeAllListeners();
    }

    public async getBalance(address: string): Promise<BigNumberish> {
        return await this.provider.getBalance(address);
    }

    public async getBlock(blockHashOrNumber: string | number): Promise<any> {
        return await this.provider.getBlock(blockHashOrNumber);
    }

    public async getTransaction(hash: string): Promise<TransactionResponse> {
        const tx = await this.provider.getTransaction(hash);
        if (!tx) throw new Error(`Transaction not found: ${hash}`);

        const receipt = await tx.wait();
        
        return {
            hash: tx.hash,
            from: tx.from,
            to: tx.to!,
            value: tx.value,
            gasLimit: tx.gasLimit,
            gasPrice: tx.gasPrice || 0,
            nonce: tx.nonce,
            data: tx.data,
            chainId: tx.chainId,
            status: receipt ? (receipt.status ? 'confirmed' : 'failed') : 'pending',
            receipt: receipt ? {
                blockNumber: receipt.blockNumber,
                blockHash: receipt.blockHash,
                transactionIndex: receipt.index,
                status: receipt.status === 1,
                gasUsed: receipt.gasUsed,
                effectiveGasPrice: receipt.gasPrice,
                logs: receipt.logs
            } : undefined
        };
    }

    public async getTransactionCount(address: string): Promise<number> {
        return await this.provider.getTransactionCount(address);
    }

    public async sendTransaction(config: TransactionConfig): Promise<TransactionResponse> {
        if (!this.signer) {
            throw new Error('No signer available');
        }

        const tx = await this.signer.sendTransaction({
            to: config.to,
            data: config.data,
            value: config.value,
            gasLimit: config.gasLimit,
            gasPrice: config.gasPrice,
            maxFeePerGas: config.maxFeePerGas,
            maxPriorityFeePerGas: config.maxPriorityFeePerGas,
            nonce: config.nonce
        });

        return this.getTransaction(tx.hash);
    }

    public async estimateGas(config: TransactionConfig): Promise<BigNumberish> {
        return await this.provider.estimateGas({
            to: config.to,
            data: config.data,
            value: config.value
        });
    }

    public on(event: string | EventFilter, listener: (log: EventLog) => void): void {
        if (typeof event === 'string') {
            this.provider.on(event, listener);
        } else {
            this.provider.on(event, listener);
        }
    }

    public off(event: string | EventFilter, listener: (log: EventLog) => void): void {
        if (typeof event === 'string') {
            this.provider.off(event, listener);
        } else {
            this.provider.off(event, listener);
        }
    }

    public async call(contract: ContractConfig, method: string, args: any[]): Promise<any> {
        const ethersContract = new ethers.Contract(
            contract.address,
            contract.abi,
            this.provider
        );

        return await ethersContract[method](...args);
    }

    public async estimateContractGas(
        contract: ContractConfig,
        method: string,
        args: any[]
    ): Promise<BigNumberish> {
        const ethersContract = new ethers.Contract(
            contract.address,
            contract.abi,
            this.provider
        );

        return await ethersContract[method].estimateGas(...args);
    }

    public setSigner(signer: ethers.Signer): void {
        this.signer = signer;
    }

    public getSigner(): ethers.Signer | undefined {
        return this.signer;
    }
} 