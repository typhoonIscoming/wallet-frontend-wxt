/**
 * 发送 ERC-20 代币页面组件
 */
import { useState, useEffect } from 'react';
import { useWalletStore } from '@/utils/wallet-store';
import useTokenBalance from '@/hooks/useTokenBalance';
import type { PopupRoute } from '@/entrypoints/background/types';
import type { Token } from '@/types/wallet';
import Header from './header';
import { ethers } from 'ethers';

interface SendTokenPageProps {
	token?: Token;
	onNavigate: (route: PopupRoute) => void;
}

export default function SendTokenPage({ token, onNavigate }: SendTokenPageProps) {
	const { tokens, currentAccount, currentNetwork, isLocked, getWallet } = useWalletStore();
	const [selectedToken, setSelectedToken] = useState<Token | null>(token || null);
	const [sendTo, setSendTo] = useState('');
	const [sendAmount, setSendAmount] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { balance: tokenBalance, loading: balanceLoading } = useTokenBalance(
		selectedToken?.address || ''
	);

	useEffect(() => {
		if (tokens.length > 0 && !selectedToken) {
			setSelectedToken(tokens[0]);
		}
	}, [tokens, selectedToken]);

	const handleSend = async () => {
		if (!selectedToken || !sendTo || !sendAmount || !currentAccount || isLocked) return;

		setLoading(true);
		setError(null);

		try {
			const wallet = await getWallet();
			if (!wallet) {
				throw new Error('钱包未解锁');
			}

			const provider = useWalletStore.getState().getProvider();
			if (!provider) {
				throw new Error('Provider not available');
			}

			// ERC-20 transfer ABI
			const ERC20_ABI = ['function transfer(address to, uint256 amount) returns (bool)'];

			const tokenContract = new ethers.Contract(selectedToken.address, ERC20_ABI, wallet);
			const amountWei = ethers.parseUnits(sendAmount, selectedToken.decimals);

			// 估算 gas
			const gasEstimate = await tokenContract.transfer.estimateGas(sendTo, amountWei);
			const gasPrice = await provider.getFeeData();

			const tx = await tokenContract.transfer(sendTo, amountWei, {
				gasLimit: gasEstimate,
				maxFeePerGas: gasPrice.maxFeePerGas,
				maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
			});

			// 等待交易确认
			await tx.wait();

			// 清空表单
			setSendTo('');
			setSendAmount('');

			// 返回主页面
			onNavigate('main');
		} catch (err: any) {
			console.error('发送代币失败:', err);
			setError(err.message || '发送代币失败');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-full w-full">
			<Header
				title="发送代币"
				showBack
				onBack={() => {
					onNavigate('tokens');
					setSendTo('');
					setSendAmount('');
				}}
				className="p-2 bg-white sticky top-0"
			/>
			<div className="px-2 pt-4 pb-4">
				<div className="space-y-4">
					{/* 选择代币 */}
					<div>
						<div className="text-sm text-slate-900 mb-2">选择代币</div>
						<select
							value={selectedToken?.address || ''}
							onChange={(e) => {
								const token = tokens.find((t) => t.address === e.target.value);
								setSelectedToken(token || null);
							}}
							className="w-full rounded-lg border border-slate-800 bg-gray-600 px-3 py-2 text-sm text-slate-100 focus:border-accent focus:outline-none transition-colors"
						>
							{tokens.map((t) => (
								<option key={t.address} value={t.address}>
									{t.symbol} - {t.name}
								</option>
							))}
						</select>
					</div>

					{/* 余额显示 */}
					{selectedToken && (
						<div className="rounded-xl border border-slate-800 bg-gray-600 px-3 py-4">
							<div className="text-xs text-slate-100 mb-1">可用余额</div>
							<div className="flex items-baseline gap-2">
								<div className="text-xl font-bold text-slate-100">
									{balanceLoading ? '...' : tokenBalance || '0'}
								</div>
								<div className="text-sm text-slate-300">{selectedToken.symbol}</div>
							</div>
						</div>
					)}

					{/* 接收地址 */}
					<div>
						<div className="text-sm text-slate-900 mb-2">接收地址</div>
						<input
							type="text"
							placeholder="0x..."
							value={sendTo}
							onChange={(e) => setSendTo(e.target.value)}
							className="w-full rounded-lg border border-slate-800 bg-gray-600 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-100 focus:border-accent focus:outline-none font-mono transition-colors"
							disabled={loading}
						/>
					</div>

					{/* 金额 */}
					<div>
						<div className="text-sm text-slate-900 mb-2">
							金额 ({selectedToken?.symbol || ''})
						</div>
						<div className="relative">
							<input
								type="number"
								step="any"
								placeholder="0.0"
								value={sendAmount}
								onChange={(e) => setSendAmount(e.target.value)}
								className="w-full rounded-lg border border-slate-800 bg-gray-600 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-100 focus:border-accent focus:outline-none transition-colors"
								disabled={loading}
							/>
							<button
								className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-accent hover:text-accent-light transition-colors"
								onClick={() => setSendAmount(tokenBalance || '0')}
								disabled={loading}
							>
								最大
							</button>
						</div>
					</div>

					{error && (
						<div className="rounded-lg border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
							{error}
						</div>
					)}

					<button
						className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-black hover:bg-accent-light transition-colors shadow-lg shadow-accent/20 disabled:opacity-60 disabled:cursor-not-allowed"
						onClick={handleSend}
						disabled={loading || !sendTo || !sendAmount || !selectedToken || isLocked}
					>
						{loading ? '发送中...' : '发送'}
					</button>
				</div>
			</div>
		</div>
	);
}
