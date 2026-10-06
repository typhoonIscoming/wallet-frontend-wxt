/**
 * 添加网络页面组件
 */
import { useState } from 'react';
import type { PopupRoute } from '@/entrypoints/background/types';
import Header from './header';
import { useWalletStore } from '@/utils/wallet-store';

interface AddNetworkPageProps {
	onNavigate: (route: PopupRoute) => void;
}

export default function AddNetworkPage({ onNavigate }: AddNetworkPageProps) {
	const { networks, addNetwork } = useWalletStore();

	const [chainId, setChainId] = useState('');
	const [name, setName] = useState('');
	const [rpcUrl, setRpcUrl] = useState('');
	const [currencySymbol, setCurrencySymbol] = useState('');
	const [blockExplorer, setBlockExplorer] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const onAddNetwork = async () => {
		if (!chainId || !name || !rpcUrl || !currencySymbol) {
			setError('请填写所有必填字段');
			return;
		}
		let chainIdHex: string;
		if (chainId.startsWith('0x')) {
			chainIdHex = chainId;
		} else {
			const chainIdNum = parseInt(chainId, 10);
			if (isNaN(chainIdNum)) {
				setError('Chain ID 格式无效');
				return;
			}
			chainIdHex = '0x' + chainIdNum.toString(16);
		}
		setLoading(true);
		setError(null);
		try {
			const chainParams: {
				chainId: string;
				chainName: string;
				nativeCurrency: {
					name: string;
					symbol: string;
					decimals: number;
				};
				rpcUrls: string[];
				blockExplorerUrls?: string[];
			} = {
				chainId: chainIdHex,
				chainName: name,
				nativeCurrency: {
					name: currencySymbol,
					symbol: currencySymbol,
					decimals: 18,
				},
				rpcUrls: [rpcUrl],
			};
			if (blockExplorer) {
				chainParams.blockExplorerUrls = [blockExplorer];
			}
			const response = await browser.runtime.sendMessage({
				type: 'EIP1193_REQUEST',
				method: 'wallet_addEthereumChain',
				params: [chainParams],
			});

			if (response?.success && response.result === null) {
				// 从 storage 重新获取网络列表并更新到 store
				const storage = browser.storage.local;
				const result = (await storage.get('wallet-store')) as {
					'wallet-store'?: { state?: { networks?: any[] } };
				};
				const walletStore = result['wallet-store'];
				if (walletStore?.state?.networks) {
					const chainId = parseInt(chainIdHex, 16);
					const newNetwork = walletStore.state.networks.find(
						(n: any) => n.chainId === chainId
					);
					if (newNetwork) {
						const exists = networks.find((n) => n.chainId === chainId);
						if (!exists) {
							addNetwork(newNetwork);
						}
					}
				}
				onNavigate('networks');
				// 清空表单
				setChainId('');
				setName('');
				setRpcUrl('');
				setCurrencySymbol('');
				setBlockExplorer('');
			} else if (response?.success === false) {
				throw new Error(response.error?.message || '添加网络失败');
			}
		} catch (error) {
			setError('添加网络失败');
			console.error(error);
		} finally {
			setLoading(false);
		}
	};
	return (
		<div className="min-h-full w-full">
			<Header
				title="添加网络"
				className="p-2 bg-white sticky top-0"
				showBack
				onBack={() => onNavigate('networks')}
			/>
			<div className="px-2 pt-4 pb-4">
				<div className="space-y-4">
					<div>
						<div className="text-sm text-slate-900 mb-2">
							Chain ID (十六进制或十进制)
						</div>
						<input
							type="text"
							placeholder="例如: 0x89 或 137"
							value={chainId}
							onChange={(e) => setChainId(e.target.value)}
							className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-100 focus:border-accent focus:outline-none font-mono transition-colors"
							disabled={loading}
						/>
					</div>

					<div>
						<div className="text-sm text-slate-900 mb-2">网络名称</div>
						<input
							type="text"
							placeholder="例如: Polygon Mainnet"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-100 focus:border-accent focus:outline-none transition-colors"
							disabled={loading}
						/>
					</div>

					<div>
						<div className="text-sm text-slate-900 mb-2">RPC URL</div>
						<input
							type="text"
							placeholder="例如: https://polygon-rpc.com"
							value={rpcUrl}
							onChange={(e) => setRpcUrl(e.target.value)}
							className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-100 focus:border-accent focus:outline-none transition-colors"
							disabled={loading}
						/>
					</div>

					<div>
						<div className="text-sm text-slate-900 mb-2">货币符号</div>
						<input
							type="text"
							placeholder="例如: MATIC"
							value={currencySymbol}
							onChange={(e) => setCurrencySymbol(e.target.value)}
							className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-100 focus:border-accent focus:outline-none transition-colors"
							disabled={loading}
						/>
					</div>

					<div>
						<div className="text-sm text-slate-900 mb-2">区块浏览器 URL (可选)</div>
						<input
							type="text"
							placeholder="例如: https://polygonscan.com"
							value={blockExplorer}
							onChange={(e) => setBlockExplorer(e.target.value)}
							className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-100 focus:border-accent focus:outline-none transition-colors"
							disabled={loading}
						/>
					</div>

					{error && (
						<div className="rounded-lg border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
							{error}
						</div>
					)}

					<button
						className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-black hover:bg-accent-light transition-colors shadow-lg shadow-accent/20 disabled:opacity-60 disabled:cursor-not-allowed"
						onClick={onAddNetwork}
						disabled={loading || !chainId || !name || !rpcUrl || !currencySymbol}
					>
						{loading ? '添加中...' : '添加网络'}
					</button>
				</div>
			</div>
		</div>
	);
}
