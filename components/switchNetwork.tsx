import { useState, useEffect } from 'react';
import useRoute from '@/hooks/useRoute';
import { useWalletStore } from '@/utils/wallet-store';
import type { PopupRoute, SwitchChainRequest } from '@/entrypoints/background/types';
import Header from './header';
import useSwitchChain from '@/hooks/useSwitchChain';

interface SwitchChainPageProps {
	onNavigate: (route: PopupRoute) => void;
}

export default function SwitchChainPage({ onNavigate }: SwitchChainPageProps) {
	const { currentNetwork } = useWalletStore();
	const {
		switchChainRequest,
		fetchSwitchChainRequest,
		handleSwitchChainApprove,
		handleSwitchChainReject,
	} = useSwitchChain();
	const { route } = useRoute();

	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const onReject = async () => {
		setLoading(true);
		setError(null);
		try {
			await handleSwitchChainReject();
			onNavigate('main');
		} catch (err) {
			setError('切换网络失败，请重试。');
		} finally {
			setLoading(false);
		}
	};

	const onApprove = async () => {
		setLoading(true);
		setError(null);
		try {
			await handleSwitchChainApprove();
		} catch (err) {
			setError('切换网络失败，请重试。');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (route === 'switch-chain') {
			fetchSwitchChainRequest();
		}
	}, [route, fetchSwitchChainRequest]);

	if (!switchChainRequest) {
		return (
			<div className="min-h-full w-full">
				<Header
					title="切换网络"
					className="p-2"
					showBack
					onBack={() => onNavigate('main')}
				/>
				<div className="px-2 pb-4">
					<div className="text-sm rounded-xl bg-slate-200 py-6 text-slate-900 text-center mb-4">
						等待切换网络请求...
					</div>
				</div>
			</div>
		);
	}

	if (!switchChainRequest?.targetNetwork) {
		return (
			<div className="min-h-full w-full">
				<Header
					title="切换网络"
					showBack
					className="p-2"
					onBack={() => onNavigate('main')}
				/>
				<div className="px-2 pt-0 pb-4">
					<div className="text-sm rounded-xl px-2 text-center py-6 bg-slate-200 text-slate-900 mb-4">
						目标网络不存在
					</div>
					<button
						className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-light transition-colors shadow-lg shadow-accent/20"
						onClick={onReject}
					>
						关闭
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-full w-[360px] bg-black text-slate-100">
			<Header title="切换网络" showBack className="p-2" onBack={() => onNavigate('main')} />
			<div className="px-4 pt-4 pb-4">
				<div className="text-sm text-slate-400 mb-4">以下网站想要切换您的网络</div>

				<div className="space-y-4">
					<div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
						<div className="text-xs text-slate-400 mb-1">网站</div>
						<div className="text-sm font-medium text-slate-100 break-all">
							{switchChainRequest?.origin}
						</div>
					</div>

					<div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
						<div className="text-xs text-slate-400 mb-2">当前网络</div>
						<div className="text-sm font-medium text-slate-100">
							{currentNetwork.name}
						</div>
						<div className="text-xs text-slate-400 mt-1">
							Chain ID: {currentNetwork.chainId} • {currentNetwork.currencySymbol}
						</div>
					</div>

					<div className="rounded-xl border border-accent/30 bg-accent/10 p-4">
						<div className="text-xs text-accent mb-2">目标网络</div>
						<div className="text-sm font-medium text-slate-100">
							{switchChainRequest?.targetNetwork?.name}
						</div>
						<div className="text-xs text-accent/80 mt-1">
							Chain ID: {switchChainRequest?.targetNetwork?.chainId} •{' '}
							{switchChainRequest?.targetNetwork?.currencySymbol}
						</div>
					</div>

					<div className="rounded-lg border border-yellow-900/40 bg-yellow-950/20 p-3">
						<div className="text-xs text-yellow-200">
							⚠️ 切换网络后，您的交易将在新的网络上执行。请确保您了解切换网络的影响。
						</div>
					</div>

					{error && (
						<div className="rounded-lg border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
							{error}
						</div>
					)}

					<div className="flex gap-3">
						<button
							className="flex-1 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
							onClick={onReject}
							disabled={loading}
						>
							拒绝
						</button>
						<button
							className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-light transition-colors shadow-lg shadow-accent/20 disabled:opacity-60 disabled:cursor-not-allowed"
							onClick={onApprove}
							disabled={loading}
						>
							切换
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
