/**
 * ERC-20 代币余额管理 Hook
 */
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWalletStore } from '@/utils/wallet-store';
import type { Token } from '@/types/wallet';

// ERC-20 标准 ABI（仅需要 balanceOf 和 decimals）
const ERC20_ABI = [
	'function balanceOf(address owner) view returns (uint256)',
	'function decimals() view returns (uint8)',
	'function symbol() view returns (string)',
	'function name() view returns (string)',
];

export default function useTokenBalance(tokenAddress: string) {
	const { currentAccount, isLocked, currentNetwork, getProvider } = useWalletStore();
	const [balance, setBalance] = useState<string>('0');
	const [loading, setLoading] = useState(false);
	const [tokenInfo, setTokenInfo] = useState<{
		symbol: string;
		name: string;
		decimals: number;
	} | null>(null);

	const fetchTokenBalance = useCallback(async () => {
		if (!currentAccount || isLocked || !tokenAddress) {
			setBalance('0');
			return;
		}

		setLoading(true);
		try {
			const provider = getProvider();
			if (!provider) {
				console.error('[TokenBalance] Provider not available');
				setBalance('0');
				return;
			}

			const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
			if (!tokenContract) {
				setBalance('0');
				return;
			}
			// 并行获取余额和代币信息
			const [balanceResult, decimals, symbol, name] = await Promise.all([
				tokenContract.balanceOf(currentAccount.address),
				tokenContract.decimals(),
				tokenContract.symbol().catch(() => 'UNKNOWN'),
				tokenContract.name().catch(() => 'Unknown Token'),
			]);

			const balanceFormatted = ethers.formatUnits(balanceResult, decimals);
			setBalance(balanceFormatted);
			setTokenInfo({ symbol, name, decimals });
		} catch (error: any) {
			console.error('获取代币余额失败:', error);
			setBalance('0');
		} finally {
			setLoading(false);
		}
	}, [currentAccount, isLocked, currentNetwork, tokenAddress, getProvider]);

	useEffect(() => {
		if (!isLocked && currentAccount && tokenAddress) {
			fetchTokenBalance();
		}
	}, [currentAccount, isLocked, currentNetwork, tokenAddress, fetchTokenBalance]);

	return {
		balance,
		loading,
		tokenInfo,
		fetchTokenBalance,
	};
}

/**
 * 批量获取多个代币余额
 */
export function useTokenBalances(tokens: Token[]) {
	const { currentAccount, isLocked, currentNetwork, getProvider, updateTokenBalance } =
		useWalletStore();
	const [loading, setLoading] = useState(false);

	const fetchAllBalances = useCallback(async () => {
		if (!currentAccount || isLocked || tokens.length === 0) {
			return;
		}

		setLoading(true);
		try {
			const provider = getProvider();
			if (!provider) {
				console.error('[TokenBalances] Provider not available');
				return;
			}

			// 并行获取所有代币余额
			const balancePromises = tokens.map(async (token) => {
				try {
					const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);
					const balanceResult = await tokenContract.balanceOf(currentAccount.address);
					const balanceFormatted = ethers.formatUnits(balanceResult, token.decimals);
					console.log(`获取代币 ${token.symbol} 余额:`, balanceFormatted, tokenContract);
					updateTokenBalance(token.address, balanceFormatted);
					return { address: token.address, balance: balanceFormatted };
				} catch (error) {
					console.error(`获取代币 ${token.symbol} 余额失败:`, error);
					return { address: token.address, balance: '0' };
				}
			});

			await Promise.all(balancePromises);
		} catch (error: any) {
			console.error('批量获取代币余额失败:', error);
		} finally {
			setLoading(false);
		}
	}, [currentAccount, isLocked, currentNetwork, tokens, getProvider, updateTokenBalance]);

	useEffect(() => {
		if (!isLocked && currentAccount && tokens.length > 0) {
			fetchAllBalances();
			// 每30秒自动刷新
			const interval = setInterval(fetchAllBalances, 30000);
			return () => clearInterval(interval);
		}
	}, [currentAccount, isLocked, currentNetwork, tokens, fetchAllBalances]);

	return {
		loading,
		fetchAllBalances,
	};
}
