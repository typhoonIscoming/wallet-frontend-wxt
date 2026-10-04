/**
 * 网络选择页面组件
 */
import { useState } from 'react';
import { useWalletStore } from '@/utils/wallet-store';
import type { PopupRoute } from '@/entrypoints/background/types';
import Header from './header';

interface NetworksPageProps {
	onNavigate: (route: PopupRoute) => void;
}

export default function NetworksPage({ onNavigate }: NetworksPageProps) {
	const { networks, currentNetwork, switchNetwork } = useWalletStore();
	const [error, setError] = useState<string | null>(null);

	const onSwitchNetwork = async (networkId: string) => {
		// TODO: Implement network switching logic
		try {
			const network = networks.find((n) => n.id === networkId);
			if (!network) {
				setError('网络不存在');
				return;
			}

			const chainIdHex = '0x' + network.chainId.toString(16);
			const response = await browser.runtime.sendMessage({
				type: 'EIP1193_REQUEST',
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: chainIdHex }],
			});

			if (response?.success && response.result === null) {
				switchNetwork(networkId);
				onNavigate('main');
				setError(null);
			} else if (response?.success === false) {
				throw new Error(response.error?.message || '切换网络失败');
			}
		} catch (error: any) {
			console.error('切换网络失败:', error);
			setError(error.message || '切换网络失败');
		}
	};

	return (
		<div className="min-h-full w-[360px] bg-black text-slate-100">
			<Header
				title="选择网络"
				showBack
				className="p-2 sticky top-0 bg-black"
				onBack={() => onNavigate('main')}
			/>
			<div className="px-4 pt-4 pb-4">
				<div className="space-y-2 mb-4">
					{networks.map((network) => (
						<button
							key={network.id}
							onClick={() => onSwitchNetwork(network.id)}
							className={`w-full rounded-lg border p-4 text-left transition-all ${
								network.id === currentNetwork.id
									? 'border-accent bg-accent/10'
									: 'border-slate-800 bg-slate-900/60 hover:bg-slate-900/80 hover:border-accent/50'
							}`}
						>
							<div className="flex items-center justify-between">
								<div className="flex-1">
									<div className="text-sm font-medium text-slate-100 mb-1">
										{network.name}
									</div>
									<div className="text-xs text-slate-400">
										Chain ID: {network.chainId} • {network.currencySymbol}
									</div>
								</div>
								{network.id === currentNetwork.id && (
									<div className="ml-3">
										<svg
											className="w-5 h-5 text-accent"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
												clipRule="evenodd"
											/>
										</svg>
									</div>
								)}
							</div>
						</button>
					))}
				</div>

				<button
					className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800 flex items-center justify-center gap-2"
					onClick={() => onNavigate('add-network')}
				>
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 4v16m8-8H4"
						/>
					</svg>
					添加网络
				</button>
			</div>
		</div>
	);
}
