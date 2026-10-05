/**
 * 代币列表页面组件
 */
import { useState, useEffect } from 'react';
import { useWalletStore } from '@/utils/wallet-store';
import { useTokenBalances } from '@/hooks/useTokenBalance';
import type { PopupRoute } from '@/entrypoints/background/types';
import Header from './header';
import { ethers, Contract } from 'ethers';
import { PlusIcon, CancelIcon } from './icons';
interface TokensPageProps {
	onNavigate: (route: PopupRoute) => void;
}

export default function TokensPage({ onNavigate }: TokensPageProps) {
	const { tokens, currentAccount, currentNetwork, networks, addToken, removeToken } =
		useWalletStore();
	const { loading } = useTokenBalances(tokens);
	const [showAddToken, setShowAddToken] = useState(false);
	const [tokenAddress, setTokenAddress] = useState('');
	const [selectedNetworkId, setSelectedNetworkId] = useState<string>('');
	const [adding, setAdding] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// 初始化选中的网络为当前网络
	useEffect(() => {
		if (!selectedNetworkId && currentNetwork) {
			setSelectedNetworkId(currentNetwork.id);
		}
	}, [currentNetwork, selectedNetworkId]);

	const handleAddToken = async () => {
		if (!tokenAddress || !currentAccount) return;

		setAdding(true);
		setError(null);

		try {
			// 根据选中的网络创建 provider
			const selectedNetwork =
				networks.find((n) => n.id === selectedNetworkId) || currentNetwork;
			const provider = new ethers.JsonRpcProvider(selectedNetwork.rpcUrl, {
				name: selectedNetwork.name,
				chainId: selectedNetwork.chainId,
			});

			// ERC-20 ABI
			const ERC20_ABI = [
				'function decimals() view returns (uint8)',
				'function symbol() view returns (string)',
				'function name() view returns (string)',
			];

			const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
			if (!tokenContract) {
				setError('代币合约无效');
				return;
			}
			const [decimals, symbol, name] = await Promise.all([
				tokenContract.decimals(),
				tokenContract.symbol(),
				tokenContract.name(),
			]);

			addToken({
				address: tokenAddress,
				symbol,
				name,
				decimals: Number(decimals),
			});

			setTokenAddress('');
			setShowAddToken(false);
		} catch (err: any) {
			console.error('添加代币失败:', err);
			setError(err.message || '添加代币失败');
		} finally {
			setAdding(false);
		}
	};

	return (
		<div className="min-h-full w-full">
			<Header
				title="代币"
				showBack
				onBack={() => onNavigate('main')}
				rightAction={
					<div
						className="flex cursor-pointer p-[4px] hover:bg-[#e8e8e8] items-center gap-2"
						onClick={() => setShowAddToken(!showAddToken)}
					>
						{showAddToken ? <CancelIcon /> : <PlusIcon />}
						{showAddToken ? '取消' : '添加'}
					</div>
				}
				className="p-2 bg-white sticky top-0"
			/>
			<div className="px-4 pt-4 pb-4">
				{showAddToken && (
					<div className="mb-4 p-4 rounded-lg border border-slate-800 bg-gray-600">
						{/* 区块链网络选择 */}
						<div className="mb-3">
							<div className="text-sm text-slate-200 mb-2">区块链网络</div>
							<select
								value={selectedNetworkId || currentNetwork?.id || ''}
								onChange={(e) => setSelectedNetworkId(e.target.value)}
								className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-accent focus:outline-none transition-colors"
							>
								{networks.map((network) => (
									<option key={network.id} value={network.id}>
										{network.name} ({network.currencySymbol})
									</option>
								))}
							</select>
						</div>

						{/* 代币合约地址 */}
						<div className="mb-3">
							<div className="text-sm text-slate-200 mb-2">代币合约地址</div>
							<input
								type="text"
								placeholder="0x..."
								value={tokenAddress}
								onChange={(e) => setTokenAddress(e.target.value)}
								className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none font-mono transition-colors"
							/>
						</div>

						{error && <div className="text-xs text-red-400 mb-3">{error}</div>}

						<button
							onClick={handleAddToken}
							disabled={adding || !tokenAddress}
							className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-light transition-colors disabled:opacity-60"
						>
							{adding ? '添加中...' : '添加代币'}
						</button>
					</div>
				)}

				{loading && tokens.length === 0 && (
					<div className="text-center text-slate-400 py-8">加载中...</div>
				)}

				{!loading && tokens.length === 0 && (
					<div className="text-center bg-gray-600 rounded-xl text-slate-200 py-8">
						<div className="mb-2">暂无代币</div>
						<div className="text-xs">点击右上角"添加"按钮添加代币</div>
					</div>
				)}

				<div className="space-y-2">
					{tokens.map((token) => (
						<div
							key={token.address}
							className="rounded-lg border border-gray-600 bg-gray-600 p-4 hover:bg-slate-900/80 transition-colors cursor-pointer"
							onClick={() => {
								onNavigate('send-token');
								// 可以通过路由参数传递 token 信息
							}}
						>
							<div className="flex items-center justify-between">
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-1">
										{token.logoURI ? (
											<img
												src={token.logoURI}
												alt={token.symbol}
												className="w-8 h-8 rounded-full"
											/>
										) : (
											<div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
												<span className="text-xs font-bold text-accent">
													{token.symbol.substring(0, 2).toUpperCase()}
												</span>
											</div>
										)}
										<div>
											<div className="text-sm font-medium text-slate-100">
												{token.symbol}
											</div>
											<div className="text-xs text-slate-200">
												{token.name}
											</div>
										</div>
									</div>
								</div>
								<div className="text-right">
									<div className="text-sm font-medium text-slate-100">
										{token.balance
											? parseFloat(token.balance).toFixed(6)
											: '0.000000'}
									</div>
									<button
										onClick={(e) => {
											e.stopPropagation();
											removeToken(token.address);
										}}
										className="text-xs text-red-400 hover:text-red-300 mt-1"
									>
										删除
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
