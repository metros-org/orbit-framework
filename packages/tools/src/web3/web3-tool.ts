import { BaseTool } from '../base-tool';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

export class Web3Tool extends BaseTool {
    private client: any;

    constructor() {
        super({
            name: 'web3',
            description: 'Interact with blockchain',
            version: '1.0.0',
        });

        this.client = createPublicClient({
            chain: base,
            transport: http(),
        });
    }

    async execute(method: string, ...args: any[]) {
        switch (method) {
            case 'getBalance':
                return await this.getBalance(args[0]);
            case 'getBlock':
                return await this.getBlock(args[0]);
            default:
                throw new Error(`Unknown method: ${method}`);
        }
    }

    private async getBalance(address: string) {
        return await this.client.getBalance({ address });
    }

    private async getBlock(blockNumber: number) {
        return await this.client.getBlock({ blockNumber });
    }
}