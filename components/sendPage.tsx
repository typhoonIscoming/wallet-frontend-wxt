/**
 * 发送页面组件
 */
import { useState } from 'react';
import { ethers } from 'ethers';
import { useWalletStore } from '@/utils/wallet-store';
import { useBalance } from '../hooks/useBalance';
import type { PopupRoute } from '@/entrypoints/background/types';
import Header from './header';

interface SendPageProps {
	onNavigate: (route: PopupRoute) => void;
}

export default function SendPage({ onNavigate }: SendPageProps) {
	const { currentNetwork, currentAccount, isLocked, getProvider } = useWalletStore();
	const { balance, balanceLoading } = useBalance();
	const [sendTo, setSendTo] = useState('');
	const [sendAmount, setSendAmount] = useState('');
	const [sendLoading, setSendLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const onSendToChange = (to: string) => setSendTo(to);
	const onSendAmountChange = (amount: string) => setSendAmount(amount);
	const onSend = async () => {
		// 发送逻辑
		if (!sendTo || !sendAmount || !currentAccount) {
			setError('请填写完整信息');
			return;
		}

		const amount = parseFloat(sendAmount);
		if (isNaN(amount) || amount <= 0) {
			setError('请输入有效的金额');
			return;
		}

		// 验证地址格式
		if (!ethers.isAddress(sendTo)) {
			setError('无效的地址格式');
			return;
		}
		// 发送交易逻辑
		setSendLoading(true);
		setError(null);
		try {
			const provider = getProvider();
			// 这里可以调用 provider 发送交易
			if (!provider) {
				setError('无法连接到网络');
				return;
			}
			// 获取当前余额
			const balanceWei = await provider.getBalance(currentAccount.address);
			const balanceEth = parseFloat(ethers.formatEther(balanceWei));
			if (amount > balanceEth) {
				setError('余额不足');
				setSendLoading(false);
				return;
			}
			// 通过 background 发送交易
			const valueWei = ethers.parseEther(sendAmount);
			const response = await browser.runtime.sendMessage({
				type: 'EIP1193_REQUEST',
				method: 'eth_sendTransaction',
				params: [
					{
						from: currentAccount.address,
						to: sendTo,
						value: '0x' + valueWei.toString(16),
					},
				],
			});
			if (response?.success && response.result) {
				setError(null);
				setSendTo('');
				setSendAmount('');
				onNavigate('main');
			} else {
				throw new Error(response?.error?.message || '发送交易失败');
			}
		} catch (err: any) {
			setError(err.message || '发送交易失败');
		} finally {
			setSendLoading(false);
		}
	};

	return (
		<div className="min-h-full">
			<Header
				title="发送"
				className="p-2 bg-white sticky top-0 z-999"
				showBack
				onBack={() => {
					onNavigate('main');
					onSendToChange('');
					onSendAmountChange('');
				}}
			/>
			<div className="px-2 pt-4 pb-4">
				{/* 当前网络显示 */}
				<div className="mb-4">
					<button
						onClick={() => onNavigate('networks')}
						className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-left hover:bg-slate-900/80 transition-colors"
					>
						<div className="flex items-center justify-between">
							<div>
								<div className="text-xs text-white mb-0.5">当前网络</div>
								<div className="text-sm text-white">{currentNetwork.name}</div>
							</div>
							<svg
								className="w-4 h-4 text-slate-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M8 9l4-4 4 4m0 6l-4 4-4-4"
								/>
							</svg>
						</div>
					</button>
				</div>

				<div className="space-y-4">
					{/* 余额显示 */}
					<div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
						<div className="text-xs text-white mb-1">可用余额</div>
						<div className="flex items-baseline gap-2">
							<div className="text-xl font-bold text-white">
								{balanceLoading ? '...' : balance}
							</div>
							<div className="text-sm text-white">
								{currentNetwork.currencySymbol}
							</div>
						</div>
					</div>

					{/* 接收地址 */}
					<div>
						<div className="text-sm text-black mb-2">接收地址</div>
						<input
							type="text"
							placeholder="0x..."
							value={sendTo}
							onChange={(e) => onSendToChange(e.target.value)}
							className="w-full rounded-lg border border-slate-800 bg-white px-3 py-2 text-sm text-black placeholder:text-black focus:border-accent focus:outline-none font-mono transition-colors"
							disabled={sendLoading}
						/>
					</div>

					{/* 金额 */}
					<div>
						<div className="text-sm text-black mb-2">
							金额 ({currentNetwork.currencySymbol})
						</div>
						<div className="relative">
							<input
								type="number"
								step="any"
								placeholder="0.0"
								value={sendAmount}
								onChange={(e) => onSendAmountChange(e.target.value)}
								className="w-full rounded-lg border border-slate-800 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-900 focus:border-accent focus:outline-none transition-colors"
								disabled={sendLoading}
							/>
							<button
								className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-900 transition-colors"
								onClick={() => onSendAmountChange(balance)}
								disabled={sendLoading}
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
						onClick={onSend}
						disabled={sendLoading || !sendTo || !sendAmount || isLocked}
					>
						{sendLoading ? '发送中...' : '发送'}
					</button>
				</div>
			</div>
		</div>
	);
}
