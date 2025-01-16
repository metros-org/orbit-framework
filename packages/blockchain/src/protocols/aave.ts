import { BigNumberish } from 'ethers';
import { Logger } from '@orbit/core';
import { BlockchainProvider, ContractConfig } from '../types';

export interface AaveConfig {
    poolAddress: string;
    poolAbi: any[];
    dataProviderAddress: string;
    dataProviderAbi: any[];
}

export interface ReserveData {
    configuration: {
        ltv: number;
        liquidationThreshold: number;
        liquidationBonus: number;
        decimals: number;
        active: boolean;
        frozen: boolean;
        paused: boolean;
    };
    liquidityRate: BigNumberish;
    variableBorrowRate: BigNumberish;
    stableBorrowRate: BigNumberish;
    totalAToken: BigNumberish;
    totalStableDebt: BigNumberish;
    totalVariableDebt: BigNumberish;
    availableLiquidity: BigNumberish;
    utilizationRate: BigNumberish;
}

export interface UserAccountData {
    totalCollateralETH: BigNumberish;
    totalDebtETH: BigNumberish;
    availableBorrowsETH: BigNumberish;
    currentLiquidationThreshold: BigNumberish;
    ltv: BigNumberish;
    healthFactor: BigNumberish;
}

export class AaveProtocol {
    private readonly logger: Logger;
    private readonly provider: BlockchainProvider;
    private readonly config: AaveConfig;

    constructor(provider: BlockchainProvider, config: AaveConfig) {
        this.logger = new Logger('AaveProtocol');
        this.provider = provider;
        this.config = config;
    }

    public async getReserveData(asset: string): Promise<ReserveData> {
        const dataProvider: ContractConfig = {
            address: this.config.dataProviderAddress,
            abi: this.config.dataProviderAbi
        };

        const data = await this.provider.call(dataProvider, 'getReserveData', [asset]);

        return {
            configuration: {
                ltv: data.configuration.ltv.toNumber(),
                liquidationThreshold: data.configuration.liquidationThreshold.toNumber(),
                liquidationBonus: data.configuration.liquidationBonus.toNumber(),
                decimals: data.configuration.decimals.toNumber(),
                active: data.configuration.active,
                frozen: data.configuration.frozen,
                paused: data.configuration.paused
            },
            liquidityRate: data.liquidityRate,
            variableBorrowRate: data.variableBorrowRate,
            stableBorrowRate: data.stableBorrowRate,
            totalAToken: data.totalAToken,
            totalStableDebt: data.totalStableDebt,
            totalVariableDebt: data.totalVariableDebt,
            availableLiquidity: data.availableLiquidity,
            utilizationRate: data.utilizationRate
        };
    }

    public async getUserAccountData(user: string): Promise<UserAccountData> {
        const pool: ContractConfig = {
            address: this.config.poolAddress,
            abi: this.config.poolAbi
        };

        const data = await this.provider.call(pool, 'getUserAccountData', [user]);

        return {
            totalCollateralETH: data.totalCollateralETH,
            totalDebtETH: data.totalDebtETH,
            availableBorrowsETH: data.availableBorrowsETH,
            currentLiquidationThreshold: data.currentLiquidationThreshold,
            ltv: data.ltv,
            healthFactor: data.healthFactor
        };
    }

    public async supply(
        asset: string,
        amount: BigNumberish,
        onBehalfOf: string,
        referralCode: number = 0
    ): Promise<string> {
        const pool: ContractConfig = {
            address: this.config.poolAddress,
            abi: this.config.poolAbi
        };

        const tx = await this.provider.call(pool, 'supply', [
            asset,
            amount,
            onBehalfOf,
            referralCode
        ]);

        return tx.hash;
    }

    public async borrow(
        asset: string,
        amount: BigNumberish,
        interestRateMode: number,
        referralCode: number,
        onBehalfOf: string
    ): Promise<string> {
        const pool: ContractConfig = {
            address: this.config.poolAddress,
            abi: this.config.poolAbi
        };

        const tx = await this.provider.call(pool, 'borrow', [
            asset,
            amount,
            interestRateMode,
            referralCode,
            onBehalfOf
        ]);

        return tx.hash;
    }

    public async repay(
        asset: string,
        amount: BigNumberish,
        interestRateMode: number,
        onBehalfOf: string
    ): Promise<string> {
        const pool: ContractConfig = {
            address: this.config.poolAddress,
            abi: this.config.poolAbi
        };

        const tx = await this.provider.call(pool, 'repay', [
            asset,
            amount,
            interestRateMode,
            onBehalfOf
        ]);

        return tx.hash;
    }

    public async withdraw(
        asset: string,
        amount: BigNumberish,
        to: string
    ): Promise<string> {
        const pool: ContractConfig = {
            address: this.config.poolAddress,
            abi: this.config.poolAbi
        };

        const tx = await this.provider.call(pool, 'withdraw', [
            asset,
            amount,
            to
        ]);

        return tx.hash;
    }
} 