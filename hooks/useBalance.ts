/**
 * 余额管理 Hook
 */
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWalletStore } from '@/utils/wallet-store';

export function useBalance() {
	const { currentAccount, isLocked, currentNetwork, getProvider } = useWalletStore();
	const [balance, setBalance] = useState<string>('0');
	const [balanceLoading, setBalanceLoading] = useState(false);

	// 获取余额
	const fetchBalance = useCallback(async () => {
		if (!currentAccount || isLocked) {
			setBalance('0');
			return;
		}

		setBalanceLoading(true);
		try {
			const provider = getProvider();
			if (!provider) {
				console.error('[Balance] Provider not available');
				setBalance('0');
				return;
			}

			// 添加超时处理
			const balancePromise = provider.getBalance(currentAccount.address);
			const timeoutPromise = new Promise((_, reject) =>
				setTimeout(() => reject(new Error('余额查询超时')), 10000)
			);

			const balanceWei = (await Promise.race([balancePromise, timeoutPromise])) as bigint;
			const balanceEth = ethers.formatEther(balanceWei);
			setBalance(parseFloat(balanceEth).toFixed(6));
		} catch (error: any) {
			console.error('获取余额失败:', error);
			setBalance('0');
		} finally {
			setBalanceLoading(false);
		}
	}, [currentAccount, isLocked, currentNetwork, getProvider]);

	// 当账户或网络变化时，更新余额
	useEffect(() => {
		if (!isLocked && currentAccount) {
			fetchBalance();
			// 每30秒自动刷新余额
			const interval = setInterval(fetchBalance, 30000);
			return () => clearInterval(interval);
		}
	}, [currentAccount, isLocked, currentNetwork, fetchBalance]);

	return {
		balance,
		balanceLoading,
		fetchBalance,
	};
}
