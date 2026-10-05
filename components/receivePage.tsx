/**
 * 收款页面组件
 */
import { useState } from 'react';
import { useWalletStore } from '@/utils/wallet-store';
import type { PopupRoute } from '@/entrypoints/background/types';
import Header from './header';

interface ReceivePageProps {
	onNavigate: (route: PopupRoute) => void;
}

export default function ReceivePage({ onNavigate }: ReceivePageProps) {
	const { currentAccount, currentNetwork } = useWalletStore();
	const [copied, setCopied] = useState(false);

	const qrCodeUrl = currentAccount
		? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentAccount.address)}`
		: '';

	const copyAddress = async () => {
		if (!currentAccount) return;
		try {
			await navigator.clipboard.writeText(currentAccount.address);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// 忽略错误
		}
	};

	return (
		<div className="min-h-full w-full">
			<Header
				title="收款"
				className="p-2 bg-white sticky top-0"
				showBack
				onBack={() => onNavigate('main')}
			/>
			<div className="px-4 pt-4 pb-4">
				<div className="space-y-4">
					{/* 二维码 */}
					{currentAccount && (
						<div className="flex flex-col items-center">
							<div className="rounded-xl bg-white p-4 mb-4">
								<img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
							</div>
							<div className="text-xs text-slate-400 mb-2">扫描二维码获取地址</div>
						</div>
					)}

					{/* 地址 */}
					{currentAccount && (
						<div className="rounded-xl border border-slate-200 bg-gray-200 p-4">
							<div className="text-xs text-slate-900 mb-2">收款地址</div>
							<div className="text-sm font-mono text-slate-900 break-all mb-3">
								{currentAccount.address}
							</div>
							<button
								className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-light transition-colors shadow-lg shadow-accent/20"
								onClick={copyAddress}
							>
								{copied ? '已复制' : '复制地址'}
							</button>
						</div>
					)}

					{/* 网络信息 */}
					<button
						onClick={() => onNavigate('networks')}
						className="w-full rounded-xl border border-slate-200 bg-gray-200 p-3 text-left hover:bg-slate-900/60 transition-colors"
					>
						<div className="flex items-center justify-between">
							<div>
								<div className="text-xs text-slate-900 mb-1">当前网络</div>
								<div className="text-sm text-slate-900">{currentNetwork.name}</div>
								<div className="text-xs text-slate-900 mt-1">
									Chain ID: {currentNetwork.chainId}
								</div>
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

					{/* {error && (
						<div className="rounded-lg border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
							{error}
						</div>
					)} */}
				</div>
			</div>
		</div>
	);
}
