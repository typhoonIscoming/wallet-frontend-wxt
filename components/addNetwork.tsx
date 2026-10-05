/**
 * 添加网络页面组件
 */
import { useState } from 'react';
import type { PopupRoute } from '@/entrypoints/background/types';
import Header from './header';

interface AddNetworkPageProps {
	onNavigate: (route: PopupRoute) => void;
}

export default function AddNetworkPage({ onNavigate }: AddNetworkPageProps) {
	const [chainId, setChainId] = useState('');
	const [name, setName] = useState('');
	const [rpcUrl, setRpcUrl] = useState('');
	const [currencySymbol, setCurrencySymbol] = useState('');
	const [blockExplorer, setBlockExplorer] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const onAddNetwork = () => {};
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
