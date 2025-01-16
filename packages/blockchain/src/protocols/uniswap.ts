import { ethers, BigNumberish } from 'ethers';
import { Logger } from '@orbit/core';
import { BlockchainProvider, ContractConfig } from '../types';

export interface UniswapConfig {
    factoryAddress: string;
    routerAddress: string;
    quoterAddress: string;
    factoryAbi: any[];
    routerAbi: any[];
    quoterAbi: any[];
}

export interface SwapParams {
    tokenIn: string;
    tokenOut: string;
    fee: number;
    recipient: string;
    deadline: number;
    amountIn: BigNumberish;
    amountOutMinimum: BigNumberish;
    sqrtPriceLimitX96: BigNumberish;
}

export interface Pool {
    token0: string;
    token1: string;
    fee: number;
    tickSpacing: number;
    liquidity: BigNumberish;
    sqrtPriceX96: BigNumberish;
    tick: number;
}

export class UniswapProtocol {
    private readonly logger: Logger;
    private readonly provider: BlockchainProvider;
    private readonly config: UniswapConfig;

    constructor(provider: BlockchainProvider, config: UniswapConfig) {
        this.logger = new Logger('UniswapProtocol');
        this.provider = provider;
        this.config = config;
    }

    public async getPool(tokenA: string, tokenB: string, fee: number): Promise<string> {
        const factory: ContractConfig = {
            address: this.config.factoryAddress,
            abi: this.config.factoryAbi
        };

        return await this.provider.call(factory, 'getPool', [tokenA, tokenB, fee]);
    }

    public async getPoolData(poolAddress: string): Promise<Pool> {
        const poolAbi = [
            'function token0() view returns (address)',
            'function token1() view returns (address)',
            'function fee() view returns (uint24)',
            'function tickSpacing() view returns (int24)',
            'function liquidity() view returns (uint128)',
            'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, ...)'
        ];

        const poolContract: ContractConfig = {
            address: poolAddress,
            abi: poolAbi
        };

        const [token0, token1, fee, tickSpacing, liquidity, slot0] = await Promise.all([
            this.provider.call(poolContract, 'token0', []),
            this.provider.call(poolContract, 'token1', []),
            this.provider.call(poolContract, 'fee', []),
            this.provider.call(poolContract, 'tickSpacing', []),
            this.provider.call(poolContract, 'liquidity', []),
            this.provider.call(poolContract, 'slot0', [])
        ]);

        return {
            token0,
            token1,
            fee,
            tickSpacing,
            liquidity,
            sqrtPriceX96: slot0[0],
            tick: slot0[1]
        };
    }

    public async quoteExactInputSingle(
        tokenIn: string,
        tokenOut: string,
        fee: number,
        amountIn: BigNumberish
    ): Promise<BigNumberish> {
        const quoter: ContractConfig = {
            address: this.config.quoterAddress,
            abi: this.config.quoterAbi
        };

        return await this.provider.call(quoter, 'quoteExactInputSingle', [
            tokenIn,
            tokenOut,
            fee,
            amountIn,
            0 // sqrtPriceLimitX96
        ]);
    }

    public async swap(params: SwapParams): Promise<string> {
        const router: ContractConfig = {
            address: this.config.routerAddress,
            abi: this.config.routerAbi
        };

        const exactInputParams = {
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            fee: params.fee,
            recipient: params.recipient,
            deadline: params.deadline,
            amountIn: params.amountIn,
            amountOutMinimum: params.amountOutMinimum,
            sqrtPriceLimitX96: params.sqrtPriceLimitX96
        };

        const tx = await this.provider.call(router, 'exactInputSingle', [exactInputParams]);
        return tx.hash;
    }

    public async addLiquidity(
        tokenA: string,
        tokenB: string,
        fee: number,
        amount0Desired: BigNumberish,
        amount1Desired: BigNumberish,
        amount0Min: BigNumberish,
        amount1Min: BigNumberish,
        recipient: string,
        deadline: number
    ): Promise<string> {
        const router: ContractConfig = {
            address: this.config.routerAddress,
            abi: this.config.routerAbi
        };

        const mintParams = {
            token0: tokenA,
            token1: tokenB,
            fee: fee,
            tickLower: -887272,  // TODO: Calculate based on price range
            tickUpper: 887272,   // TODO: Calculate based on price range
            amount0Desired,
            amount1Desired,
            amount0Min,
            amount1Min,
            recipient,
            deadline
        };

        const tx = await this.provider.call(router, 'mint', [mintParams]);
        return tx.hash;
    }
} 