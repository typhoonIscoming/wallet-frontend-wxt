/**
 * 添加网络确认页面组件
 */
import { useWalletStore } from '@/utils/wallet-store';
import type { PopupRoute, AddChainRequest } from '@/entrypoints/background/types';
import Header from './header';
import useAddChain from '@/hooks/useAddChain';

interface AddChainPageProps {
	onNavigate: (route: PopupRoute) => void;
}

export function AddChainPage({ onNavigate }: AddChainPageProps) {
	const { addChainRequest, handleAddChainApprove, handleAddChainReject, loading, error } =
		useAddChain();

	const handleAddChainApproveClick = async () => {
		try {
			await handleAddChainApprove();
			await onNavigate('main');
		} catch (error: any) {
			// 错误已经在 hook 中处理
		}
	};

	// 处理添加网络拒绝
	const handleAddChainRejectClick = async () => {
		try {
			await handleAddChainReject();
			await onNavigate('main');
		} catch (error: any) {
			// 错误已经在 hook 中处理
		}
	};

	if (!addChainRequest) {
		return (
			<div className="min-h-full w-[360px] bg-black text-slate-100">
				<Header title="添加网络" />
				<div className="px-4 pt-6 pb-4">
					<div className="text-sm text-slate-400 mb-4">等待添加网络请求...</div>
				</div>
			</div>
		);
	}

	const chainId = parseInt(addChainRequest.chainParams.chainId, 16);

	return (
		<div className="min-h-full w-[360px] bg-black text-slate-100">
			<Header title="添加网络" />
			<div className="px-4 pt-4 pb-4">
				<div className="text-sm text-slate-400 mb-4">以下网站想要添加网络到您的钱包</div>

				<div className="space-y-4">
					<div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
						<div className="text-xs text-slate-400 mb-1">网站</div>
						<div className="text-sm font-medium text-slate-100 break-all">
							{addChainRequest.origin}
						</div>
					</div>

					<div className="rounded-xl border border-accent/30 bg-accent/10 p-4">
						<div className="text-xs text-accent mb-2">网络信息</div>
						<div className="space-y-2">
							<div>
								<div className="text-xs text-slate-400 mb-0.5">网络名称</div>
								<div className="text-sm font-medium text-slate-100">
									{addChainRequest.chainParams.chainName}
								</div>
							</div>
							<div>
								<div className="text-xs text-slate-400 mb-0.5">Chain ID</div>
								<div className="text-sm font-medium text-slate-100">
									{chainId} ({addChainRequest.chainParams.chainId})
								</div>
							</div>
							<div>
								<div className="text-xs text-slate-400 mb-0.5">货币符号</div>
								<div className="text-sm font-medium text-slate-100">
									{addChainRequest.chainParams.nativeCurrency.symbol}
								</div>
							</div>
							<div>
								<div className="text-xs text-slate-400 mb-0.5">RPC URL</div>
								<div className="text-xs font-mono text-slate-300 break-all">
									{addChainRequest.chainParams.rpcUrls[0]}
								</div>
							</div>
							{addChainRequest.chainParams.blockExplorerUrls &&
								addChainRequest.chainParams.blockExplorerUrls[0] && (
									<div>
										<div className="text-xs text-slate-400 mb-0.5">
											区块浏览器
										</div>
										<div className="text-xs font-mono text-slate-300 break-all">
											{addChainRequest.chainParams.blockExplorerUrls[0]}
										</div>
									</div>
								)}
						</div>
					</div>

					<div className="rounded-lg border border-yellow-900/40 bg-yellow-950/20 p-3">
						<div className="text-xs text-yellow-200">
							⚠️ 请仔细检查网络信息。添加恶意网络可能导致资金损失。
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
							onClick={handleAddChainReject}
							disabled={loading}
						>
							拒绝
						</button>
						<button
							className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-light transition-colors shadow-lg shadow-accent/20 disabled:opacity-60 disabled:cursor-not-allowed"
							onClick={handleAddChainApproveClick}
							disabled={loading}
						>
							{loading ? '添加中...' : '添加'}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
